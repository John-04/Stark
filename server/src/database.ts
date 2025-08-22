import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { logger } from './utils/logger';

let db: any = null;

export const initializeDatabase = async () => {
  try {
    db = await open({
      filename: process.env.DATABASE_PATH || ':memory:', // Use file database if specified
      driver: sqlite3.Database
    });

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS queries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        query TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS saved_queries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        query TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    logger.info('Database initialized');
    return db; // Return database instance for use by other services
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

export const executeQuery = async (query: string) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // Add query validation/sanitation here
    if (query.toLowerCase().includes('drop') || 
        query.toLowerCase().includes('delete') ||
        query.toLowerCase().includes('update')) {
      throw new Error('Write operations are not allowed');
    }

    const results = await db.all(query);
    return results;
  } catch (error) {
    logger.error('Query execution failed:', error);
    throw error;
  }
};

export const saveQuery = async (userId: string, name: string, query: string) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    await db.run(
      'INSERT INTO saved_queries (user_id, name, query) VALUES (?, ?, ?)',
      [userId, name, query]
    );
  } catch (error) {
    logger.error('Failed to save query:', error);
    throw error;
  }
};

export const getSavedQueries = async (userId: string) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    return await db.all(
      'SELECT * FROM saved_queries WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  } catch (error) {
    logger.error('Failed to get saved queries:', error);
    throw error;
  }
};
