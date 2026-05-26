const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const PACKAGES_FILE = path.join(__dirname, "../data/packages.json");

// ─── MongoDB connection ────────────────────────────────────────
let _col = null;

async function col() {
  if (_col) return _col;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  _col = client.db("giftbot").collection("orders");
  return _col;
}

// ─── Orders ───────────────────────────────────────────────────
async function getOrders() {
  return (await col()).find({}).toArray();
}

async function addOrder(order) {
  await (await col()).insertOne({ ...order, _id: order.id });
  return order;
}

async function getOrderById(id) {
  return (await col()).findOne({ id }) || null;
}

async function updateOrderStatus(id, status, extra = {}) {
  const result = await (await col()).findOneAndUpdate(
    { id },
    { $set: { status, ...extra, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  return result || null;
}

// ─── Packages (still from file — they don't change) ───────────
function getPackages() {
  return JSON.parse(fs.readFileSync(PACKAGES_FILE, "utf-8"));
}

function getPackageById(id) {
  return getPackages().find((p) => p.id === id) || null;
}

module.exports = {
  getOrders,
  addOrder,
  getOrderById,
  updateOrderStatus,
  getPackages,
  getPackageById,
};
