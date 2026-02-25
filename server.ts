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

// Crear Tablas si no existen
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
`);

// Crear Usuario Administrador por defecto
const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@bg360.com');
if (!adminExists) {
  db.prepare('INSERT INTO users (id, email, password, role, name) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), 'admin@bg360.com', 'admin123', 'ADMIN', 'Super Admin BG360');
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // --- RUTAS DE LA API ---

  // Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT id, email, role, name FROM users WHERE email = ? AND password = ?').get(email, password);
    if (user) res.json(user);
    else res.status(401).json({ error: "Credenciales inválidas" });
  });

  // Listar Clientes
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare(`
      SELECT c.*, s.score, s.utilization 
      FROM clients c 
      LEFT JOIN credit_snapshots s ON c.id = s.clientId 
      ORDER BY c.createdAt DESC
    `).all();
    res.json(clients);
  });

  // Crear Cliente
  app.post("/api/clients", (req, res) => {
    const { firstName, lastName, phone, email } = req.body;
    const clientId = uuidv4();
    db.prepare('INSERT INTO clients (id, firstName, lastName, phone, stage) VALUES (?, ?, ?, ?, ?)')
      .run(clientId, firstName, lastName, phone, 'NUEVO');
    res.json({ id: clientId });
  });

  // Listar Bancos
  app.get("/api/banks", (req, res) => {
    const banks = db.prepare('SELECT * FROM bank_products WHERE active = 1').all();
    res.json(banks);
  });

  // --- SERVIR FRONTEND EN PRODUCCIÓN ---
  
  // Servir archivos estáticos de la carpeta 'dist'
  app.use(express.static(path.join(__dirname, "dist")));

  // Cualquier otra ruta redirige al index.html (para React Router)
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server ready at http://0.0.0.0:${PORT}`);
  });
}

startServer();
