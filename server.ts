import express from "express";
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('stacking.db');
db.pragma('foreign_keys = ON');

// Crear Tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, role TEXT, name TEXT);
  CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, phone TEXT, stage TEXT DEFAULT 'NUEVO', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS bank_products (id TEXT PRIMARY KEY, name TEXT, type TEXT, minScore INTEGER, maxUtilization INTEGER, link TEXT, active BOOLEAN DEFAULT 1);
`);

// --- SEEDING: Crear datos iniciales si no existen ---
const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@bg360.com');
if (!adminExists) {
  db.prepare('INSERT INTO users (id, email, password, role, name) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), 'admin@bg360.com', 'admin123', 'ADMIN', 'Super Admin');
}

const banksCount = db.prepare('SELECT count(*) as count FROM bank_products').get().count;
if (banksCount === 0) {
  const initialBanks = [
    { id: uuidv4(), name: 'Chase Sapphire Preferred', type: 'Personal', minScore: 720, maxUtilization: 30, link: 'https://chase.com' },
    { id: uuidv4(), name: 'Amex Business Gold', type: 'Business', minScore: 700, maxUtilization: 40, link: 'https://americanexpress.com' },
    { id: uuidv4(), name: 'Bank of America Unlimited', type: 'Personal', minScore: 680, maxUtilization: 35, link: 'https://bofa.com' }
  ];
  const insertBank = db.prepare('INSERT INTO bank_products (id, name, type, minScore, maxUtilization, link) VALUES (?, ?, ?, ?, ?, ?)');
  initialBanks.forEach(b => insertBank.run(b.id, b.name, b.type, b.minScore, b.maxUtilization, b.link));
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    if (user) res.json(user); else res.status(401).json({ error: "Error" });
  });

  app.get("/api/clients", (req, res) => res.json(db.prepare('SELECT * FROM clients').all()));
  
  app.get("/api/banks", (req, res) => res.json(db.prepare('SELECT * FROM bank_products WHERE active = 1').all()));

  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

  app.listen(3000, "0.0.0.0", () => console.log(`🚀 Ready`));
}
startServer();
