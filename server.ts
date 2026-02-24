import express from "express";
import { createServer as createViteServer } from "vite";
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('stacking.db');
db.pragma('foreign_keys = ON');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    userId TEXT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    phone TEXT,
    stage TEXT DEFAULT 'NUEVO',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS credit_snapshots (
    id TEXT PRIMARY KEY,
    clientId TEXT NOT NULL,
    score INTEGER NOT NULL,
    utilization INTEGER NOT NULL,
    inquiries6m INTEGER NOT NULL,
    latePayments12m INTEGER NOT NULL,
    monthlyIncome REAL NOT NULL,
    verified BOOLEAN DEFAULT 0,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clientId) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS bank_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    minScore INTEGER NOT NULL,
    maxUtilization INTEGER NOT NULL,
    states TEXT,
    docType TEXT,
    link TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS stacking_plans (
    id TEXT PRIMARY KEY,
    clientId TEXT NOT NULL,
    route TEXT NOT NULL,
    readinessScore INTEGER NOT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    status TEXT DEFAULT 'ACTIVO',
    FOREIGN KEY (clientId) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS plan_items (
    id TEXT PRIMARY KEY,
    planId TEXT NOT NULL,
    productId TEXT NOT NULL,
    scheduledDate DATETIME NOT NULL,
    status TEXT DEFAULT 'PENDIENTE',
    approvedAmount REAL,
    notes TEXT,
    FOREIGN KEY (planId) REFERENCES stacking_plans(id),
    FOREIGN KEY (productId) REFERENCES bank_products(id)
  );

  CREATE TABLE IF NOT EXISTS rule_configs (
    id TEXT PRIMARY KEY,
    config_json TEXT NOT NULL
  );
`);

// Seed Initial Data
const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@bg360.com');
if (!adminExists) {
  db.prepare('INSERT INTO users (id, email, password, role, name) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), 'admin@bg360.com', 'admin123', 'ADMIN', 'Super Admin BG360');
}

const rulesExists = db.prepare('SELECT * FROM rule_configs WHERE id = ?').get('default');
if (!rulesExists) {
  const defaultConfig = {
    weights: { score: 35, utilization: 25, inquiries: 15, latePayments: 15, income: 10 },
    thresholds: { routeA: 85, routeB: 70, routeC: 55 }
  };
  db.prepare('INSERT INTO rule_configs (id, config_json) VALUES (?, ?)')
    .run('default', JSON.stringify(defaultConfig));
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT id, email, role, name FROM users WHERE email = ? AND password = ?').get(email, password);
    if (user) res.json(user);
    else res.status(401).json({ error: "Credenciales inválidas" });
  });

  app.get("/api/clients", (req, res) => {
    const clients = db.prepare(`
      SELECT c.*, s.score, s.utilization, s.updatedAt as lastSnapshot 
      FROM clients c 
      LEFT JOIN credit_snapshots s ON c.id = s.clientId 
      ORDER BY c.createdAt DESC
    `).all();
    res.json(clients);
  });

  app.get("/api/clients/:id", (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    const snapshot = db.prepare('SELECT * FROM credit_snapshots WHERE clientId = ? ORDER BY updatedAt DESC LIMIT 1').get(req.params.id);
    const plan = db.prepare('SELECT * FROM stacking_plans WHERE clientId = ? AND status = "ACTIVO"').get(req.params.id);
    let items = [];
    if (plan) {
      items = db.prepare(`
        SELECT pi.*, bp.name as productName, bp.link as productLink 
        FROM plan_items pi 
        JOIN bank_products bp ON pi.productId = bp.id 
        WHERE pi.planId = ?
      `).all(plan.id);
    }
    res.json({ client, snapshot, plan, items });
  });

  app.post("/api/clients", (req, res) => {
    const { firstName, lastName, phone, email } = req.body;
    const userId = uuidv4();
    const clientId = uuidv4();
    db.prepare('INSERT INTO users (id, email, password, role, name) VALUES (?, ?, ?, ?, ?)')
      .run(userId, email, 'cliente123', 'CLIENTE', `${firstName} ${lastName}`);
    db.prepare('INSERT INTO clients (id, userId, firstName, lastName, phone, stage) VALUES (?, ?, ?, ?, ?, ?)')
      .run(clientId, userId, firstName, lastName, phone, 'NUEVO');
    res.json({ id: clientId });
  });

  app.get("/api/banks", (req, res) => {
    res.json(db.prepare('SELECT * FROM bank_products').all());
  });

  // Production serving
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server ready at http://0.0.0.0:${PORT}`);
  });
}

startServer();
