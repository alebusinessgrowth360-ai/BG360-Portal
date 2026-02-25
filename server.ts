import express from "express";
import { createServer as createViteServer } from "vite";
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database('stacking.db');
db.pragma('foreign_keys = ON');

// --- INICIALIZACIÓN Y MIGRACIÓN DE BASE DE DATOS ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, role TEXT, name TEXT);
  CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, phone TEXT, email TEXT, stage TEXT DEFAULT 'NUEVO', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS credit_snapshots (id TEXT PRIMARY KEY, clientId TEXT, score INTEGER, utilization INTEGER, inquiries6m INTEGER, latePayments12m INTEGER, monthlyIncome REAL, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS bank_products (id TEXT PRIMARY KEY, name TEXT, type TEXT, minScore INTEGER, maxUtilization INTEGER, bureau TEXT DEFAULT 'Experian', link TEXT, active BOOLEAN DEFAULT 1);
  CREATE TABLE IF NOT EXISTS stacking_plans (id TEXT PRIMARY KEY, clientId TEXT, route TEXT, readinessScore INTEGER, status TEXT DEFAULT 'ACTIVO', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS plan_items (id TEXT PRIMARY KEY, planId TEXT, productId TEXT, status TEXT DEFAULT 'PENDIENTE', approvedAmount REAL, scheduledDate DATETIME);
`);

// Verificar si falta la columna bureau (por si la DB es vieja)
try {
  const info = db.prepare("PRAGMA table_info(bank_products)").all();
  if (!info.some((c: any) => c.name === 'bureau')) {
    db.prepare("ALTER TABLE bank_products ADD COLUMN bureau TEXT DEFAULT 'Experian'").run();
  }
} catch (e) {}

// --- API ROUTES ---
async function startServer() {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage() });
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  app.use(express.json());

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@bg360.com' && password === 'admin123') {
      res.json({ id: '1', email, role: 'ADMIN', name: 'Admin BG360' });
    } else {
      res.status(401).json({ error: "Error" });
    }
  });

  // Clientes
  app.get("/api/clients", (req, res) => {
    res.json(db.prepare(`SELECT c.*, s.score, s.utilization FROM clients c LEFT JOIN credit_snapshots s ON c.id = s.clientId GROUP BY c.id ORDER BY c.createdAt DESC`).all());
  });

  app.get("/api/clients/:id", (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    const snapshot = db.prepare('SELECT * FROM credit_snapshots WHERE clientId = ? ORDER BY updatedAt DESC LIMIT 1').get(req.params.id);
    const plan = db.prepare('SELECT * FROM stacking_plans WHERE clientId = ?').get(req.params.id);
    const items = plan ? db.prepare('SELECT pi.*, bp.name as productName, bp.bureau FROM plan_items pi JOIN bank_products bp ON pi.productId = bp.id WHERE pi.planId = ?').all(plan.id) : [];
    res.json({ client, snapshot, plan, items });
  });

  app.post("/api/clients", (req, res) => {
    const id = uuidv4();
    const { firstName, lastName, email, phone } = req.body;
    db.prepare('INSERT INTO clients (id, firstName, lastName, email, phone) VALUES (?, ?, ?, ?, ?)').run(id, firstName, lastName, email, phone);
    res.json({ id });
  });

  // IA: Analizar PDF
  app.post("/api/clients/:id/upload-report", upload.single('report'), async (req, res) => {
    if (!req.file) return res.status(400).send("No file");
    try {
      const model = genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [
          { inlineData: { mimeType: "application/pdf", data: req.file.buffer.toString('base64') } },
          { text: "Extrae en JSON: score, utilization, inquiries6m, latePayments12m, monthlyIncome. Solo el JSON." }
        ]}]
      });
      const result = await model;
      const data = JSON.parse(result.text.match(/\{.*\}/s)![0]);
      db.prepare('INSERT INTO credit_snapshots (id, clientId, score, utilization, inquiries6m, latePayments12m, monthlyIncome) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), req.params.id, data.score, data.utilization, data.inquiries6m, data.latePayments12m, data.monthlyIncome);
      res.json(data);
    } catch (e) { res.status(500).send("Error IA"); }
  });

  // Bancos
  app.get("/api/banks", (req, res) => res.json(db.prepare('SELECT * FROM bank_products').all()));
  app.post("/api/banks", (req, res) => {
    const { name, type, minScore, maxUtilization, bureau, link } = req.body;
    db.prepare('INSERT INTO bank_products (id, name, type, minScore, maxUtilization, bureau, link) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), name, type, minScore, maxUtilization, bureau, link);
    res.json({ success: true });
  });

  // Stacking
  app.post("/api/clients/:id/generate-plan", (req, res) => {
    const snap = db.prepare('SELECT * FROM credit_snapshots WHERE clientId = ? ORDER BY updatedAt DESC LIMIT 1').get(req.params.id) as any;
    const planId = uuidv4();
    db.prepare('INSERT INTO stacking_plans (id, clientId, route, readinessScore) VALUES (?, ?, ?, ?)')
      .run(planId, req.params.id, snap.score > 700 ? 'RUTA_A' : 'RUTA_B', 85);
    
    const banks = db.prepare('SELECT * FROM bank_products WHERE minScore <= ? LIMIT 5').all(snap.score) as any[];
    banks.forEach(b => {
      db.prepare('INSERT INTO plan_items (id, planId, productId, approvedAmount, scheduledDate) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), planId, b.id, 15000, new Date().toISOString());
    });
    res.json({ success: true });
  });

  app.put("/api/plan-items/:id", (req, res) => {
    db.prepare('UPDATE plan_items SET status = ?, approvedAmount = ? WHERE id = ?').run(req.body.status, req.body.approvedAmount, req.params.id);
    res.json({ success: true });
  });

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }
  app.listen(3000, "0.0.0.0", () => console.log(`🚀 Portal BG360 Online`));
}
startServer();
