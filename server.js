'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { timingSafeEqual } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const root = __dirname;
const dataDir = path.join(root, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, 'arscon.sqlite'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    company TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    construction_materials TEXT NOT NULL,
    pressure_ratings TEXT NOT NULL,
    size_range_min INTEGER NOT NULL,
    size_range_max INTEGER NOT NULL,
    end_connections TEXT NOT NULL,
    standards TEXT NOT NULL,
    image_url TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    lead_time TEXT NOT NULL DEFAULT '3-4 weeks',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY,
    quote_no TEXT NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    project_reference TEXT NOT NULL DEFAULT '',
    delivery_location TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Pending',
    line_items TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    technical_attachments TEXT NOT NULL DEFAULT '[]',
    total_estimated_value REAL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const seeds = [
  ['GATE-150-CS', 'Cast Steel Gate Valve', 'Gate valves', 'Bolted bonnet, OS&Y rising stem, flexible wedge design for reliable isolation in demanding process lines.', ['A216 WCB', 'A351 CF8M'], ['Class 150', 'Class 300', 'Class 600'], 2, 24, ['Flanged RF', 'BW'], ['API 600', 'ASME B16.34', 'API 598'], 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=960&q=82', 48, '2-3 weeks'],
  ['BALL-3PC-316', '3-Piece Ball Valve', 'Ball valves', 'Full-bore, blowout-proof stem and fire-safe design for dependable quarter-turn service.', ['A351 CF8M', 'A105'], ['Class 150', 'Class 300', '1000 WOG'], 0.5, 8, ['NPT', 'SW', 'BW', 'Flanged'], ['API 608', 'ASME B16.34', 'API 607'], 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=960&q=82', 126, '1-2 weeks'],
  ['GLOBE-BB-800', 'Pressure Seal Globe Valve', 'Globe valves', 'Pressure-seal bonnet with guided disc for throttling and high-pressure steam applications.', ['A182 F22', 'A182 F91', 'A105'], ['Class 800', 'Class 1500'], 0.5, 4, ['SW', 'NPT'], ['API 602', 'ASME B16.34', 'BS 5352'], 'https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=960&q=82', 34, '4-5 weeks'],
  ['BUTTERFLY-DI-EPDM', 'Double Offset Butterfly Valve', 'Butterfly valves', 'High-performance resilient-seat butterfly valve for water, HVAC and general utility networks.', ['Ductile Iron', 'A216 WCB', 'Duplex 2205'], ['Class 150', 'PN 10', 'PN 16'], 2, 48, ['Wafer', 'Lug', 'Flanged'], ['API 609', 'EN 593', 'EN 12266'], 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=960&q=82', 73, '2-3 weeks'],
  ['CHECK-SWING-150', 'Swing Check Valve', 'Check valves', 'Full-opening swing check with renewable seat ring to prevent reverse flow and minimise pressure drop.', ['A216 WCB', 'A351 CF8M'], ['Class 150', 'Class 300', 'Class 600'], 2, 16, ['Flanged RF', 'BW'], ['API 594', 'ASME B16.34', 'API 598'], 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=960&q=82', 29, '3-4 weeks'],
  ['DIAPH-WEIR-PVC', 'Weir Diaphragm Valve', 'Diaphragm valves', 'Corrosion-resistant weir-pattern body for chemical dosing, water treatment and aggressive media.', ['PVC-U', 'PP', 'A351 CF8M'], ['PN 10', 'PN 16'], 0.5, 6, ['Flanged', 'Socket', 'Threaded'], ['EN 13397', 'ISO 5208'], 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=960&q=82', 57, '2-3 weeks'],
  ['Y-STRAINER-CS', 'Bolted Cover Y-Strainer', 'Strainers', 'Compact cast-body strainer with removable screen to protect downstream pumps and control equipment.', ['A216 WCB', 'A351 CF8M'], ['Class 150', 'Class 300'], 0.5, 12, ['Flanged RF', 'NPT', 'SW'], ['ASME B16.34', 'MSS SP-71'], 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=960&q=82', 92, '1-2 weeks'],
  ['STEAM-TRAP-FLOAT', 'Float & Thermostatic Trap', 'Steam traps', 'Continuous condensate discharge with air venting for heat exchangers and process equipment.', ['A216 WCB', 'A351 CF8M'], ['Class 150', 'Class 300'], 0.5, 4, ['Flanged', 'NPT', 'SW'], ['ASME B16.34', 'ISO 6552'], 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=960&q=82', 41, '3-4 weeks'],
  ['KNIFE-GATE-SLURRY', 'Slurry Knife Gate Valve', 'Gate valves', 'Rugged one-piece casting with replaceable liner for abrasive, high-solids and slurry services.', ['A216 WCB', 'Duplex 2205', 'CF8M'], ['PN 10', 'PN 16'], 2, 36, ['Wafer', 'Lug'], ['MSS SP-81', 'EN 558'], 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=960&q=82', 18, '5-6 weeks']
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products
  (sku,name,category,description,construction_materials,pressure_ratings,size_range_min,size_range_max,end_connections,standards,image_url,stock,lead_time)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
`);
for (const row of seeds) {
  insertProduct.run(row[0], row[1], row[2], row[3], JSON.stringify(row[4]), JSON.stringify(row[5]), row[6], row[7], JSON.stringify(row[8]), JSON.stringify(row[9]), row[10], row[11], row[12]);
}

const productRows = db.prepare('SELECT * FROM products ORDER BY category, name');
const quoteRows = db.prepare(`
  SELECT q.*, c.company, c.contact_name, c.email, c.phone
  FROM quotes q JOIN customers c ON c.id = q.customer_id
  ORDER BY q.created_at DESC, q.id DESC
`);
const now = () => new Date().toISOString();

function productJson(row) {
  return {
    id: row.id, sku: row.sku, name: row.name, category: row.category, description: row.description,
    constructionMaterials: JSON.parse(row.construction_materials), pressureRatings: JSON.parse(row.pressure_ratings),
    sizeRangeMin: row.size_range_min, sizeRangeMax: row.size_range_max,
    endConnections: JSON.parse(row.end_connections), standards: JSON.parse(row.standards),
    imageUrl: row.image_url, stock: row.stock, leadTime: row.lead_time
  };
}

function quoteJson(row, includeAttachmentData = false) {
  return {
    id: row.id, quoteNo: row.quote_no, company: row.company, contactName: row.contact_name,
    email: row.email, phone: row.phone, projectReference: row.project_reference,
    deliveryLocation: row.delivery_location, status: row.status,
    items: JSON.parse(row.line_items), notes: row.notes,
    attachments: JSON.parse(row.technical_attachments).map(({ name, type, size, data }) => ({ name, type, size, ...(includeAttachmentData ? { data } : {}) })),
    createdAt: row.created_at
  };
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}

function adminAuthorized(req) {
  const expected = process.env.ARSCON_ADMIN_TOKEN || '';
  const provided = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > 12 * 1024 * 1024) {
        reject(Object.assign(new Error('Request exceeds the 12 MB upload limit.'), { status: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { reject(Object.assign(new Error('Request body must be valid JSON.'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, database: 'sqlite' });

  if (req.method === 'GET' && url.pathname === '/api/products') {
    const products = productRows.all().map(productJson);
    const search = (url.searchParams.get('q') || '').toLowerCase();
    const category = url.searchParams.get('category');
    const material = url.searchParams.get('material');
    const standard = url.searchParams.get('standard');
    return json(res, 200, products.filter(p =>
      (!search || [p.name, p.sku, p.category, p.description, ...p.constructionMaterials, ...p.standards].join(' ').toLowerCase().includes(search)) &&
      (!category || p.category === category) &&
      (!material || p.constructionMaterials.includes(material)) &&
      (!standard || p.standards.includes(standard))
    ));
  }

  if (req.method === 'GET' && url.pathname === '/api/quotes') {
    if (!adminAuthorized(req)) return json(res, process.env.ARSCON_ADMIN_TOKEN ? 401 : 503, { error: process.env.ARSCON_ADMIN_TOKEN ? 'Admin authorization required.' : 'Team access is not configured on this server.' });
    return json(res, 200, quoteRows.all().map(quoteJson));
  }

  if (req.method === 'POST' && url.pathname === '/api/quotes') {
    const body = await readBody(req);
    const company = String(body.company || '').trim();
    const contactName = String(body.contactName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const items = Array.isArray(body.items) ? body.items : [];
    if (!company || !contactName || !/^\S+@\S+\.\S+$/.test(email) || !items.length) {
      return json(res, 400, { error: 'Company, contact name, valid email, and at least one quote item are required.' });
    }
    const known = new Map(productRows.all().map(row => [row.id, row]));
    const cleanItems = items.map(item => ({ productId: Number(item.productId), quantity: Math.floor(Number(item.quantity)) }))
      .filter(item => known.has(item.productId) && item.quantity >= 1 && item.quantity <= 10000);
    if (cleanItems.length !== items.length) return json(res, 400, { error: 'One or more requested products or quantities are invalid.' });
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    if (attachments.length > 5 || attachments.some(file => !file.name || typeof file.data !== 'string' || file.data.length > 8 * 1024 * 1024)) {
      return json(res, 400, { error: 'Attach up to 5 files; each file must be smaller than 6 MB.' });
    }
    const lineItems = cleanItems.map(item => ({ ...item, sku: known.get(item.productId).sku, name: known.get(item.productId).name }));
    const safeFiles = attachments.map(file => ({ name: String(file.name).slice(0, 180), type: String(file.type || 'application/octet-stream').slice(0, 100), size: Number(file.size) || 0, data: file.data }));

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(`INSERT INTO customers (company,contact_name,email,phone) VALUES (?,?,?,?)
        ON CONFLICT(email) DO UPDATE SET company=excluded.company, contact_name=excluded.contact_name, phone=excluded.phone`)
        .run(company, contactName, email, phone);
      const customer = db.prepare('SELECT id FROM customers WHERE email = ?').get(email);
      const result = db.prepare(`INSERT INTO quotes (quote_no,customer_id,project_reference,delivery_location,line_items,notes,technical_attachments,created_at)
        VALUES ('PENDING',?,?,?,?,?,?,?)`)
        .run(customer.id, String(body.projectReference || '').slice(0, 160), String(body.deliveryLocation || '').slice(0, 240), JSON.stringify(lineItems), String(body.notes || '').slice(0, 6000), JSON.stringify(safeFiles), now());
      const quoteNo = `ARS-${new Date().getFullYear()}-${String(result.lastInsertRowid).padStart(5, '0')}`;
      db.prepare('UPDATE quotes SET quote_no = ? WHERE id = ?').run(quoteNo, result.lastInsertRowid);
      db.exec('COMMIT');
      return json(res, 201, { quoteNo, status: 'Pending' });
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/summary') {
    if (!adminAuthorized(req)) return json(res, process.env.ARSCON_ADMIN_TOKEN ? 401 : 503, { error: process.env.ARSCON_ADMIN_TOKEN ? 'Admin authorization required.' : 'Team access is not configured on this server.' });
    const products = db.prepare('SELECT COUNT(*) AS count, SUM(stock) AS stock, SUM(CASE WHEN stock < 25 THEN 1 ELSE 0 END) AS low_stock FROM products').get();
    const quotes = db.prepare(`SELECT COUNT(*) AS count, SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending FROM quotes`).get();
    return json(res, 200, { productCount: products.count, stockUnits: products.stock || 0, lowStockCount: products.low_stock || 0, inquiryCount: quotes.count, pendingInquiries: quotes.pending || 0, recentQuotes: quoteRows.all().slice(0, 8).map(quoteJson) });
  }

  const statusMatch = url.pathname.match(/^\/api\/quotes\/(\d+)$/);
  if (req.method === 'GET' && statusMatch) {
    if (!adminAuthorized(req)) return json(res, process.env.ARSCON_ADMIN_TOKEN ? 401 : 503, { error: process.env.ARSCON_ADMIN_TOKEN ? 'Admin authorization required.' : 'Team access is not configured on this server.' });
    const row = quoteRows.all().find(quote => quote.id === Number(statusMatch[1]));
    return row ? json(res, 200, quoteJson(row, true)) : json(res, 404, { error: 'Quote not found.' });
  }
  if (req.method === 'PATCH' && statusMatch) {
    if (!adminAuthorized(req)) return json(res, process.env.ARSCON_ADMIN_TOKEN ? 401 : 503, { error: process.env.ARSCON_ADMIN_TOKEN ? 'Admin authorization required.' : 'Team access is not configured on this server.' });
    const body = await readBody(req);
    const allowed = ['Pending', 'Reviewing', 'Quoted', 'Won', 'Closed'];
    if (!allowed.includes(body.status)) return json(res, 400, { error: 'Invalid quote status.' });
    const result = db.prepare('UPDATE quotes SET status = ? WHERE id = ?').run(body.status, Number(statusMatch[1]));
    return result.changes ? json(res, 200, { ok: true }) : json(res, 404, { error: 'Quote not found.' });
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return fs.createReadStream(path.join(root, 'index.html')).pipe(res);
  }

  return json(res, 404, { error: 'Not found.' });
}

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT) || 3001;
const server = http.createServer((req, res) => handle(req, res).catch(error => {
  if (!res.headersSent) json(res, error.status || 500, { error: error.message || 'Internal server error.' });
  else res.destroy(error);
}));

server.listen(port, host, () => {
  console.log(`Arscon procurement portal: http://${host}:${port}`);
  console.log(`SQLite database: ${path.join(dataDir, 'arscon.sqlite')}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  db.close();
  server.close(() => process.exit(0));
});