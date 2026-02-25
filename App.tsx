import express from "express";
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database('stacking.db');
db.pragma('foreign_keys = ON');

// --- TABLAS ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, role TEXT, name TEXT);
  CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, phone TEXT, email TEXT, stage TEXT DEFAULT 'NUEVO', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS credit_snapshots (id TEXT PRIMARY KEY, clientId TEXT, score INTEGER, utilization INTEGER, inquiries INTEGER, income REAL, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS bank_products (id TEXT PRIMARY KEY, name TEXT, type TEXT, minScore INTEGER, maxUtilization INTEGER, link TEXT, active BOOLEAN DEFAULT 1);
`);

async function startServer() {
  const app = express();
  app.use(express.json());

  // API: Listar todos los clientes
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare(`
      SELECT c.*, s.score, s.utilization 
      FROM clients c 
      LEFT JOIN credit_snapshots s ON c.id = s.clientId 
      ORDER BY c.createdAt DESC
    `).all();
    res.json(clients);
  });
  
  // API: Ver un cliente y su reporte de crédito
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

  app.listen(3000, "0.0.0.0", () => console.log(`🚀 Portal BG360 Online`));
}
startServer();
