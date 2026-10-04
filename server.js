const express = require('express'), path = require('path'), crypto = require('crypto'), fs = require('fs');
const http = require('http'), https = require('https');
const helmet = require('helmet'), compression = require('compression'), rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

const prod = process.env.NODE_ENV === 'production';
const PORT = +process.env.PORT || 3000;
const ADMIN = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
let SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  if (prod) { console.error('Set JWT_SECRET in .env'); process.exit(1); }
  SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('JWT_SECRET is missing: using a temporary one (logins reset on restart).');
}

/* ---------- Database (SQLite file: data.db) ---------- */
const db = new Database(process.env.DB_FILE || path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), name TEXT NOT NULL,
  stars INTEGER NOT NULL, text TEXT NOT NULL, approved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS inquiries(id INTEGER PRIMARY KEY, user_id INTEGER, name TEXT NOT NULL, phone TEXT NOT NULL,
  program TEXT, last_class TEXT, note TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);

const app = express();
app.set('trust proxy', 1);

/* ---------- Security headers, compression, limits ---------- */
app.use(helmet({
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
    scriptSrcAttr: ["'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    mediaSrc: ["'self'"],
    frameSrc: ['https://www.facebook.com'],
    connectSrc: ["'self'", 'https://*.google-analytics.com', 'https://www.googletagmanager.com'],
    ...(prod ? {} : { upgradeInsecureRequests: null })
  } },
  crossOriginEmbedderPolicy: false
}));
if (prod) app.use((req, res, next) => req.secure ? next() : res.redirect(301, 'https://' + req.headers.host + req.url)); // force HTTPS
app.use(compression());
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
const limit = (minutes, n) => rateLimit({ windowMs: minutes * 60 * 1000, limit: n, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' } });
app.use('/api', limit(15, 300));

/* ---------- Login helpers (JWT in an httpOnly cookie) ---------- */
const COOKIE = 'gct_token';
const clean = (v, n) => String(v || '').trim().slice(0, n);
function issue(res, user) {
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: prod, maxAge: 7 * 24 * 3600 * 1000 });
}
app.use((req, res, next) => {
  try {
    const { id } = jwt.verify(req.cookies[COOKIE], SECRET);
    req.user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
  } catch (e) { /* not logged in */ }
  next();
});
const need = (req, res, next) => req.user ? next() : res.status(401).json({ error: 'Please log in first.' });
const admin = (req, res, next) => req.user && req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Administrators only.' });

/* ---------- Accounts ---------- */
app.post('/api/register', limit(15, 10), (req, res) => {
  const name = clean(req.body.name, 80), email = clean(req.body.email, 120).toLowerCase(), pw = String(req.body.password || '');
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || pw.length < 8 || pw.length > 100)
    return res.status(400).json({ error: 'Enter your name, a valid email and a password of at least 8 characters.' });
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email))
    return res.status(409).json({ error: 'This email is already registered.' });
  const info = db.prepare('INSERT INTO users(name, email, password_hash, role) VALUES(?,?,?,?)')
    .run(name, email, bcrypt.hashSync(pw, 10), email === ADMIN ? 'admin' : 'student');
  issue(res, { id: info.lastInsertRowid });
  res.json({ ok: true });
});
app.post('/api/login', limit(15, 10), (req, res) => {
  const email = clean(req.body.email, 120).toLowerCase();
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!u || !bcrypt.compareSync(String(req.body.password || ''), u.password_hash))
    return res.status(401).json({ error: 'Wrong email or password.' });
  if (email === ADMIN && u.role !== 'admin') db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(u.id);
  issue(res, u);
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => { res.clearCookie(COOKIE); res.json({ ok: true }); });
app.get('/api/me', (req, res) => res.json({ user: req.user || null }));

/* ---------- Reviews (need login, shown after admin approval) ---------- */
app.get('/api/reviews', (req, res) =>
  res.json(db.prepare('SELECT name, stars, text FROM reviews WHERE approved = 1 ORDER BY id DESC LIMIT 50').all()));
app.post('/api/reviews', need, (req, res) => {
  const stars = Number(req.body.stars), text = clean(req.body.text, 300);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5 || text.length < 3)
    return res.status(400).json({ error: 'Choose 1 to 5 stars and write your review.' });
  db.prepare('INSERT INTO reviews(user_id, name, stars, text) VALUES(?,?,?,?)').run(req.user.id, req.user.name, stars, text);
  res.json({ ok: true });
});

/* ---------- Admission inquiries ---------- */
app.post('/api/inquiries', limit(60, 20), (req, res) => {
  const b = req.body, name = clean(b.name, 80), phone = clean(b.phone, 20);
  if (name.length < 2 || !/^[0-9+\-\s]{7,20}$/.test(phone))
    return res.status(400).json({ error: 'Enter your name and a valid phone number.' });
  db.prepare('INSERT INTO inquiries(user_id, name, phone, program, last_class, note) VALUES(?,?,?,?,?,?)')
    .run(req.user ? req.user.id : null, name, phone, clean(b.program, 60), clean(b.lastClass, 80), clean(b.note, 500));
  res.json({ ok: true });
});

/* ---------- Dashboard ---------- */
app.get('/api/dashboard', need, (req, res) => {
  const u = req.user;
  if (u.role === 'admin') return res.json({ user: u,
    inquiries: db.prepare('SELECT * FROM inquiries ORDER BY id DESC LIMIT 200').all(),
    pendingReviews: db.prepare('SELECT id, name, stars, text FROM reviews WHERE approved = 0 ORDER BY id').all() });
  res.json({ user: u,
    myReviews: db.prepare('SELECT stars, text, approved FROM reviews WHERE user_id = ? ORDER BY id DESC').all(u.id),
    myInquiries: db.prepare('SELECT * FROM inquiries WHERE user_id = ? ORDER BY id DESC').all(u.id) });
});
app.post('/api/admin/reviews/:id/approve', admin, (req, res) => {
  db.prepare('UPDATE reviews SET approved = 1 WHERE id = ?').run(+req.params.id); res.json({ ok: true });
});
app.delete('/api/admin/reviews/:id', admin, (req, res) => {
  db.prepare('DELETE FROM reviews WHERE id = ?').run(+req.params.id); res.json({ ok: true });
});
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

/* ---------- Website files + caching (a CDN such as Cloudflare uses these headers) ---------- */
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], setHeaders: (res, p) => {
  const keep = prod && !p.endsWith('.html') && !p.endsWith('sw.js');
  res.setHeader('Cache-Control', keep ? 'public, max-age=604800' : 'no-cache');
} }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((err, req, res, next) => res.status(400).json({ error: 'Bad request.' }));

/* ---------- Start (HTTPS directly if certificate files are set) ---------- */
const ssl = process.env.SSL_KEY_FILE && process.env.SSL_CERT_FILE;
const server = ssl
  ? https.createServer({ key: fs.readFileSync(process.env.SSL_KEY_FILE), cert: fs.readFileSync(process.env.SSL_CERT_FILE) }, app)
  : http.createServer(app);
server.listen(PORT, () => console.log('GCT Kamalia website: ' + (ssl ? 'https' : 'http') + '://localhost:' + PORT));
