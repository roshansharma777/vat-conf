const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const databaseFile = process.env.SQLITE_FILE || path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(databaseFile, (err) => {
  if (err) {
    console.error('Failed to open SQLite database:', err.message);
    process.exit(1);
  }
});

db.exec('PRAGMA foreign_keys = ON;');

let transactionLock = Promise.resolve();

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) return reject(err);
    resolve(rows);
  });
});

const exec = (sql) => new Promise((resolve, reject) => {
  db.exec(sql, (err) => {
    if (err) return reject(err);
    resolve();
  });
});

const query = async (sql, params = []) => {
  const rows = await all(sql, params);
  return [rows];
};

const getConnection = async () => {
  let unlock;
  const nextLock = new Promise((resolve) => { unlock = resolve; });
  const currentLock = transactionLock;
  transactionLock = transactionLock.then(() => nextLock);

  await currentLock;

  return {
    run,
    query,
    exec,
    beginTransaction: () => run('BEGIN TRANSACTION'),
    commit: () => run('COMMIT'),
    rollback: () => run('ROLLBACK'),
    release: () => {
      unlock();
      return Promise.resolve();
    },
    close: () => new Promise((resolve) => db.close(() => resolve())),
  };
};

module.exports = { query, run, exec, getConnection };

