import express from "express";
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database('stacking.db');
db.pragma('foreign_keys = ON');

// --- TABLAS ACTUALIZADAS ---
try {
  db.prepare(`CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, phone TEXT, email TEXT, stage TEXT DEFAULT 'NUEVO', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
  db.prepare(`CREATE TABLE IF NOT EXISTS credit_snapshots (id TEXT PRIMARY KEY, clientId TEXT, score INTEGER, utilization INTEGER, inquiries INTEGER, income REAL, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
  // Añadimos la columna 'bureau' a bank_products
  db.prepare(`CREATE TABLE IF NOT EXISTS bank_products (id TEXT PRIMARY KEY, name TEXT, type TEXT, minScore INTEGER, maxUtilization INTEGER, bureau TEXT, link TEXT, active BOOLEAN DEFAULT 1)`).run();
  console.log("✅ Tablas listas.");
} catch (err) { console.error(err); }

// --- SEEDING CON BURÓS ---
const banksCount = db.prepare('SELECT count(*) as count FROM bank_products').get().count;
if (banksCount === 0) {
  const insert = db.prepare('INSERT INTO bank_products (id, name, type, minScore, maxUtilization, bureau, link) VALUES (?, ?, ?, ?, ?, ?, ?)');
  [
    ['Chase Business Ink', 'Business', 720, 30, 'Experian', 'https://chase.com'],
    ['Amex Blue Business Plus', 'Business', 700, 40, 'Experian', 'https://americanexpress.com'],
    ['BofA Business Advantage', 'Business', 680, 35, 'TransUnion', 'https://bofa.com'],
    ['Discover IT Cash Back', 'Personal', 670, 30, 'Equifax', 'https://discover.com'],
    ['Wells Fargo Reflect', 'Personal', 700, 25, 'Experian', 'https://wellsfargo.com']
  ].forEach(b => insert.run(uuidv4(), ...b));
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get("/api/clients", (req, res) => res.json(db.prepare('SELECT c.*, s.score FROM clients c LEFT JOIN credit_snapshots s ON c.id = s.clientId ORDER BY c.createdAt DESC').all()));
  app.get("/api/clients/:id", (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    const snapshot = db.prepare('SELECT * FROM credit_snapshots WHERE clientId = ? ORDER BY updatedAt DESC LIMIT 1').get(req.params.id);
    res.json({ client, snapshot });
  });
  app.post("/api/clients", (req, res) => {
    const { firstName, lastName, phone, email, score, utilization, income } = req.body;
    const clientId = uuidv4();
    db.prepare('INSERT INTO clients (id, firstName, lastName, phone, email) VALUES (?, ?, ?, ?, ?)').run(clientId, firstName, lastName, phone, email);
    db.prepare('INSERT INTO credit_snapshots (id, clientId, score, utilization, income) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), clientId, score, utilization, income);
    res.json({ id: clientId });
  });
  app.get("/api/banks", (req, res) => res.json(db.prepare('SELECT * FROM bank_products WHERE active = 1').all()));

  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  app.listen(3000, "0.0.0.0", () => console.log(`🚀 Ready`));
}
startServer();
