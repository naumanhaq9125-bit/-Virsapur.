import { DatabaseSync } from 'node:sqlite';

export function createSavedArticlesStore(file) {
  const database = new DatabaseSync(file);
  database.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS saved_articles (
      user_id TEXT NOT NULL CHECK(length(user_id) BETWEEN 5 AND 120),
      article_id TEXT NOT NULL CHECK(length(article_id) BETWEEN 1 AND 240),
      saved_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      PRIMARY KEY (user_id, article_id)
    ) WITHOUT ROWID;
  `);
  const listQuery = database.prepare('SELECT article_id AS articleId, saved_at AS savedAt FROM saved_articles WHERE user_id = ? ORDER BY saved_at DESC, article_id');
  const saveQuery = database.prepare('INSERT INTO saved_articles(user_id,article_id) VALUES(?,?) ON CONFLICT(user_id,article_id) DO NOTHING');
  const removeQuery = database.prepare('DELETE FROM saved_articles WHERE user_id = ? AND article_id = ?');
  return {
    list(userId) { return listQuery.all(userId); },
    save(userId,articleId) { saveQuery.run(userId,articleId); return true; },
    remove(userId,articleId) { return removeQuery.run(userId,articleId).changes > 0; },
    close() { database.close(); },
  };
}
