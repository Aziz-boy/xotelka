const fs = require("fs");
const path = require("path");

const PACKAGES_FILE = path.join(__dirname, "../data/packages.json");
const ORDERS_FILE   = path.join(__dirname, "../data/orders.json");

// ─── File-based storage helpers ───────────────────────────────
function readFile() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]");
    return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
  } catch { return []; }
}

function writeFile(orders) {
  const dir = path.dirname(ORDERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// ─── MongoDB (optional) ────────────────────────────────────────
let _col = null;
let _useFile = !process.env.MONGODB_URI;

async function getCol() {
  if (_useFile) return null;
  if (_col) return _col;
  try {
    const { MongoClient } = require("mongodb");
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    _col = client.db("giftbot").collection("orders");
    console.log("✅ MongoDB connected");
    return _col;
  } catch (err) {
    console.warn("⚠️  MongoDB unavailable, switching to file storage:", err.message);
    _useFile = true;
    return null;
  }
}

// ─── Orders ───────────────────────────────────────────────────
async function getOrders() {
  if (_useFile) return readFile();
  return (await getCol()).find({}).toArray();
}

async function addOrder(order) {
  if (_useFile) {
    const orders = readFile();
    orders.push(order);
    writeFile(orders);
    return order;
  }
  await (await getCol()).insertOne({ ...order, _id: order.id });
  return order;
}

async function getOrderById(id) {
  if (_useFile) return readFile().find(o => o.id === id) || null;
  return (await getCol()).findOne({ id }) || null;
}

async function updateOrderStatus(id, status, extra = {}) {
  const update = { status, ...extra, updatedAt: new Date().toISOString() };
  if (_useFile) {
    const orders = readFile();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return null;
    orders[idx] = { ...orders[idx], ...update };
    writeFile(orders);
    return orders[idx];
  }
  const result = await (await getCol()).findOneAndUpdate(
    { id },
    { $set: update },
    { returnDocument: "after" }
  );
  return result || null;
}

// ─── Packages (file-only, they don't change) ──────────────────
function getPackages() {
  return JSON.parse(fs.readFileSync(PACKAGES_FILE, "utf-8"));
}

function getPackageById(id) {
  return getPackages().find(p => p.id === id) || null;
}

module.exports = {
  getOrders,
  addOrder,
  getOrderById,
  updateOrderStatus,
  getPackages,
  getPackageById,
};
