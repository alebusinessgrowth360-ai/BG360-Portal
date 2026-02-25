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

console.log("🛠️ Iniciando base de datos...");

// Crear Tablas una por una para asegurar el éxito
try {
  db.prepare(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, role TEXT, name TEXT)`).run();
  db.prepare(`CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, phone TEXT, email TEXT, stage TEXT DEFAULT 'NUEVO', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
  db.prepare(`CREATE TABLE IF NOT EXISTS credit_snapshots (id TEXT PRIMARY KEY, clientId TEXT, score INTEGER, utilization INTEGER, inquiries INTEGER, income REAL, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
  db.prepare(`CREATE TABLE IF NOT EXISTS bank_products (id TEXT PRIMARY KEY, name TEXT, type TEXT, minScore INTEGER, maxUtilization INTEGER, link TEXT, active BOOLEAN DEFAULT 1)`).run();
  db.prepare(`CREATE TABLE IF NOT EXISTS stacking_plans (id TEXT PRIMARY KEY, clientId TEXT, status TEXT DEFAULT 'ACTIVO', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
  
  console.log("✅ Tablas verificadas/creadas con éxito.");
} catch (err) {
  console.error("❌ Error crítico creando tablas:", err);
}

// --- SEEDING: Crear bancos si la tabla está vacía ---
try {
  const banksCount = db.prepare('SELECT count(*) as count FROM bank_products').get().count;
  if (banksCount === 0) {
    const insert = db.prepare('INSERT INTO bank_products (id, name, type, minScore, maxUtilization, link) VALUES (?, ?, ?, ?, ?, ?)');
    const initialBanks = [
      ['Chase Business Ink', 'Business', 720, 30, 'https://chase.com'],
      ['Amex Blue Business Plus', 'Business', 700, 40, 'https://americanexpress.com'],
      ['BofA Business Advantage', 'Business', 680, 35, 'https://bofa.com'],
      ['Discover IT Cash Back', 'Personal', 670, 30, 'https://discover.com']
    ];
    initialBanks.forEach(b => insert.run(uuidv4(), ...b));
    console.log("🏦 Bancos iniciales cargados.");
  }
} catch (err) {
  console.error("❌ Error en seeding de bancos:", err);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API: Listar Clientes
  app.get("/api/clients", (req, res) => {
    try {
      const clients = db.prepare(`
        SELECT c.*, s.score, s.utilization 
        FROM clients c 
        LEFT JOIN credit_snapshots s ON c.id = s.clientId 
        ORDER BY c.createdAt DESC
      `).all();
      res.json(clients);
    } catch (e) {
      res.status(500).json({ error: "Error al obtener clientes" });
    }
  });
  
  // API: Ver Detalles de un Cliente
  app.get("/api/clients/:id", (req, res) => {
    try {
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
      const snapshot = db.prepare('SELECT * FROM credit_snapshots WHERE clientId = ? ORDER BY updatedAt DESC LIMIT 1').get(req.params.id);
      res.json({ client, snapshot });
    } catch (e) {
      res.status(404).json({ error: "Cliente no encontrado" });
    }
  });

  // API: Crear Cliente
  app.post("/api/clients", (req, res) => {
    try {
      const { firstName, lastName, phone, email, score, utilization, income } = req.body;
      const clientId = uuidv4();
      db.prepare('INSERT INTO clients (id, firstName, lastName, phone, email) VALUES (?, ?, ?, ?, ?)').run(clientId, firstName, lastName, phone, email);
      db.prepare('INSERT INTO credit_snapshots (id, clientId, score, utilization, income) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), clientId, score, utilization, income);
      res.json({ id: clientId });
    } catch (e) {
      res.status(500).json({ error: "Error al crear cliente" });
    }
  });

  // API: Listar Bancos
  app.get("/api/banks", (req, res) => {
    try {
      const banks = db.prepare('SELECT * FROM bank_products WHERE active = 1').all();
      res.json(banks);
    } catch (e) {
      res.status(500).json({ error: "Error al obtener bancos" });
    }
  });

  // Servir Frontend
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

  app.listen(3000, "0.0.0.0", () => {
    console.log(`🚀 Portal BG360 Online en puerto 3000`);
  });
}

startServer();
