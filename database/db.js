import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "database.db");
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(DB_PATH);

export const initDB = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("PRAGMA journal_mode = WAL;");
      db.run("PRAGMA foreign_keys = ON;");

      // Create the tables if they don't exist
      db.exec(
        `
          CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS submissions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              problem_id INTEGER NOT NULL,
              filename TEXT NOT NULL,
              score INTEGER,
              status TEXT DEFAULT 'Pending',
              details TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
          );

          CREATE TABLE IF NOT EXISTS problems (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              problem_id TEXT UNIQUE,
              title TEXT,
              time_limit INTEGER,
              memory_limit INTEGER,
              num_of_tests INTEGER,
              score INTEGER,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `,
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Seed the default admin account

          db.get(
            "SELECT 1 FROM users WHERE username = ?",
            ["admin"],
            (err, row) => {
              if (err) return reject(err);

              if (row) return resolve(); // Admin user already exists, no need to insert

              db.run(
                `
            INSERT INTO users (username, password) 
            VALUES (?, ?) ON CONFLICT(username) DO NOTHING
          `,
                ["admin", "admin123"],
                (err) => {
                  if (err) {
                    reject(err);
                    return;
                  }

                  console.log(
                    "----------------------------------------------------------",
                  );
                  console.log(" Seeded default admin account:");
                  console.log("   username: admin");
                  console.log("   password: admin123");
                  console.log(
                    " Please change this password / create a new admin in production.",
                  );
                  console.log(
                    "----------------------------------------------------------",
                  );
                  resolve();
                },
              );
            },
          );
        },
      );
    });
  });
};

export const openDB = async () => {
  return open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });
};
