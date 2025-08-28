export async function apiLogin(username: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('login failed');
  return res.json();
}

export async function apiRegister(username: string, password: string) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('register failed');
  return res.json();
}

export async function apiMe() {
  const res = await fetch('/api/me', { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
}

export async function apiSubmitResult(result: 'win'|'loss'|'draw', pointsDelta: number) {
  const res = await fetch('/api/game/result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ result, pointsDelta }),
  });
  if (!res.ok) throw new Error('submit failed');
  return res.json();
}

export async function apiLeaderboard() {
  const res = await fetch('/api/leaderboard', { credentials: 'include' });
  if (!res.ok) throw new Error('leaderboard failed');
  return res.json();
}
