const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET_IN_PRODUCTION";
const db = new Database("doomlink.db");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({error:"Authentification requise"});
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({error:"Session invalide"});
  }
}

app.post("/api/register", async (req, res) => {
  const {name, email, password} = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({error:"Nom, e-mail et mot de passe (6 caractères minimum) requis"});
  try {
    const hash = await bcrypt.hash(password, 12);
    const info = db.prepare(
      "INSERT INTO users (name,email,password_hash) VALUES (?,?,?)"
    ).run(name.trim(), email.trim().toLowerCase(), hash);
    const user = {id: info.lastInsertRowid, name: name.trim(), email: email.trim().toLowerCase()};
    const token = jwt.sign(user, JWT_SECRET, {expiresIn:"7d"});
    res.json({token, user});
  } catch (e) {
    if (String(e).includes("UNIQUE")) return res.status(409).json({error:"Cette adresse e-mail est déjà utilisée"});
    res.status(500).json({error:"Erreur serveur"});
  }
});

app.post("/api/login", async (req, res) => {
  const {email, password} = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email=?").get((email||"").trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password||"", user.password_hash)))
    return res.status(401).json({error:"E-mail ou mot de passe incorrect"});
  const safe = {id:user.id, name:user.name, email:user.email};
  const token = jwt.sign(safe, JWT_SECRET, {expiresIn:"7d"});
  res.json({token, user:safe});
});

app.get("/api/me", auth, (req,res) => res.json({user:req.user}));

app.get("/api/posts", (req,res) => {
  const posts = db.prepare(`
    SELECT posts.id, posts.content, posts.created_at, users.id AS user_id, users.name
    FROM posts JOIN users ON users.id=posts.user_id
    ORDER BY posts.id DESC LIMIT 50
  `).all();
  res.json({posts});
});

app.post("/api/posts", auth, (req,res) => {
  const content = (req.body.content || "").trim();
  if (!content) return res.status(400).json({error:"La publication est vide"});
  const info = db.prepare("INSERT INTO posts (user_id,content) VALUES (?,?)").run(req.user.id, content);
  const post = db.prepare(`
    SELECT posts.id, posts.content, posts.created_at, users.id AS user_id, users.name
    FROM posts JOIN users ON users.id=posts.user_id WHERE posts.id=?
  `).get(info.lastInsertRowid);
  res.status(201).json({post});
});

app.listen(PORT, () => {
  console.log(`Doomlink est lancé sur http://localhost:${PORT}`);
});
