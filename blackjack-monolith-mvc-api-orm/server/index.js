const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const morgan = require('morgan');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { AppDataSource } = require('./data-source');
const User = require('./entity/User');
require('dotenv').config();

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
};

if ((process.env.DB_TYPE || 'sqlite') === 'sqlite') {
  sessionOptions.store = new SQLiteStore({
    db: 'sessions.db',
    dir: path.join(__dirname, 'data')
  });
}

app.use(session(sessionOptions));

// CORS for API (if serving frontend from Netlify in future)
app.use(cors({
  origin: true,
  credentials: true
}));

// Auth helpers
function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  return res.redirect('/login');
}

// MVC Routes (server-rendered pages)
app.get('/', (req, res) => {
  res.render('home', { user: req.session.user });
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const repo = AppDataSource.getRepository('User');
  const user = await repo.findOne({ where: { username } });
  if (!user) return res.render('login', { error: 'Usuario o contraseña inválidos' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.render('login', { error: 'Usuario o contraseña inválidos' });
  req.session.userId = user.id;
  req.session.user = { id: user.id, username: user.username };
  res.redirect('/dashboard');
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const repo = AppDataSource.getRepository('User');
  const existing = await repo.findOne({ where: { username } });
  if (existing) return res.render('register', { error: 'Usuario ya existe' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = repo.create({ username, passwordHash });
  await repo.save(user);
  res.redirect('/login');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/dashboard', requireAuth, async (req, res) => {
  const repo = AppDataSource.getRepository('User');
  const user = await repo.findOne({ where: { id: req.session.userId } });
  res.render('dashboard', { user });
});

// REST API
const api = express.Router();

api.get('/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'not_authenticated' });
  const repo = AppDataSource.getRepository('User');
  const user = await repo.findOne({ where: { id: req.session.userId } });
  res.json({ id: user.id, username: user.username, points: user.points, wins: user.wins, losses: user.losses });
});

api.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  const repo = AppDataSource.getRepository('User');
  const existing = await repo.findOne({ where: { username } });
  if (existing) return res.status(409).json({ error: 'user_exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = repo.create({ username, passwordHash });
  await repo.save(user);
  req.session.userId = user.id;
  req.session.user = { id: user.id, username: user.username };
  res.status(201).json({ id: user.id, username: user.username });
});

api.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const repo = AppDataSource.getRepository('User');
  const user = await repo.findOne({ where: { username } });
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
  req.session.userId = user.id;
  req.session.user = { id: user.id, username: user.username };
  res.json({ id: user.id, username: user.username });
});

api.post('/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

api.post('/game/result', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'not_authenticated' });
  const { result, pointsDelta } = req.body; // result: 'win' | 'loss' | 'draw'
  const repo = AppDataSource.getRepository('User');
  const user = await repo.findOne({ where: { id: req.session.userId } });
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  user.points = (user.points || 0) + (parseInt(pointsDelta || 0, 10) || 0);
  if (result === 'win') user.wins += 1;
  else if (result === 'loss') user.losses += 1;
  await repo.save(user);
  res.json({ points: user.points, wins: user.wins, losses: user.losses });
});

api.get('/leaderboard', async (req, res) => {
  const repo = AppDataSource.getRepository('User');
  const top = await repo.createQueryBuilder('u')
    .select(['u.id', 'u.username', 'u.points', 'u.wins', 'u.losses'])
    .orderBy('u.points', 'DESC')
    .limit(20)
    .getRawMany();
  res.json(top);
});

app.use('/api', api);

// Serve built React app (dist) under /app
const distPath = path.join(__dirname, '..', 'dist');
app.use('/app', express.static(distPath));
app.get('/app/*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

// Start server after DB init
const PORT = process.env.PORT || 5174;

AppDataSource.initialize().then(() => {
  console.log('📦 Database connected');
  app.listen(PORT, () => {
    console.log(`🚀 Monolith running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to init datasource', err);
  process.exit(1);
});
