const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    username: {
      type: 'varchar',
      unique: true,
      length: 64,
    },
    passwordHash: {
      name: 'password_hash',
      type: 'varchar',
      length: 255,
    },
    points: {
      type: 'int',
      default: 0,
    },
    wins: {
      type: 'int',
      default: 0,
    },
    losses: {
      type: 'int',
      default: 0,
    },
    createdAt: {
      name: 'created_at',
      type: 'datetime',
      createDate: true,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'datetime',
      updateDate: true,
    }
  },
  indices: [
    { columns: ['username'], unique: true }
  ]
});
