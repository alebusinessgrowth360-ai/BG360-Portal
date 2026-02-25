import express from "express";
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialización de la Base de Datos
const db = new Database('stacking.db');
db.pragma('foreign_keys = ON');

console.log("🛠️ Actualizando base de datos para incluir Burós...");

// --- ACTUALIZACIÓN DE TABLAS ---
try {
  // Asegurar tablas básicas
  db.prepare(`CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, phone TEXT, email TEXT, stage TEXT DEFAULT 'NUEVO', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
  db.prepare(`CREATE TABLE IF NOT EXISTS credit_snapshots (id TEXT PRIMARY KEY, clientId TEXT, score INTEGER, utilization INTEGER, inquiries INTEGER, income REAL, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
  db.prepare(`CREATE TABLE IF NOT EXISTS bank_products (id TEXT PRIMARY KEY, name TEXT, type TEXT, minScore INTEGER, maxUtilization INTEGER, link TEXT, active BOOLEAN DEFAULT 1)`).run();

  // Añadir columna 'bureau' si no existe
  const tableInfo = db.prepare("PRAGMA table_info(bank_products)").all();
  const hasBureau = tableInfo.some((col: any) => col.name === 'bureau');
  if (!hasBureau) {
    db.prepare("ALTER TABLE bank_products ADD COLUMN bureau TEXT DEFAULT 'Experian'").run();
    console.log("🚀 Columna 'bureau' añadida con éxito.");
  }
} catch (err) { console.error("Error actualizando DB:", err); }

// --- RE-CARGAR BANCOS CON SUS BURÓS REALES ---
try {
  db.prepare('DELETE FROM bank_products').run();
  const insert = db.prepare('INSERT INTO bank_products (id, name, type, minScore, maxUtilization, bureau, link) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const initialBanks = [
    ['Chase Business Ink', 'Business', 720, 30, 'Experian', 'https://chase.com'],
    ['Amex Blue Business Plus', 'Business', 700, 40, 'Experian', 'https://americanexpress.com'],
    ['BofA Business Advantage', 'Business', 680, 35, 'TransUnion', 'https://bofa.com'],
    ['Discover IT Cash Back', 'Personal', 670, 30, 'Equifax', 'https://discover.com'],
    ['Wells Fargo Reflect', 'Personal', 700, 25, 'Experian', 'https://wellsfargo.com']
  ];
  initialBanks.forEach(b => insert.run(uuidv4(), ...b));
  console.log("🏦 Bancos actualizados con Burós.");
} catch (err) { console.error(err); }

async function startServer() {
  const app = express();
  app.use(express.json());

  // API: Listar Clientes
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare(`
      SELECT c.*, s.score 
      FROM clients c 
      LEFT JOIN credit_snapshots s ON c.id = s.clientId 
      ORDER BY c.createdAt DESC
    `).all();
    res.json(clients);
  });
  
  // API: Detalles de Cliente (Corregido)
  app.get("/api/clients/:id", (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    const snapshot = db.prepare('SELECT * FROM credit_snapshots WHERE clientId = ? ORDER BY updatedAt DESC LIMIT 1').get(req.params.id);
    res.json({ client, snapshot });
  });

  // API: Crear Cliente
  app.post("/api/clients", (req, res) => {
    const { firstName, lastName, phone, email, score, utilization, income } = req.body;
    const clientId = uuidv4();
    db.prepare('INSERT INTO clients (id, firstName, lastName, phone, email) VALUES (?, ?, ?, ?, ?)').run(clientId, firstName, lastName, phone, email);
    db.prepare('INSERT INTO credit_snapshots (id, clientId, score, utilization, income) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), clientId, score, utilization, income);
    res.json({ id: clientId });
  });

  // API: Listar Bancos
  app.get("/api/banks", (req, res) => {
    res.json(db.prepare('SELECT * FROM bank_products WHERE active = 1').all());
  });

  // Servir Frontend
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

  app.listen(3000, "0.0.0.0", () => console.log(`🚀 Ready`));
}

startServer();
