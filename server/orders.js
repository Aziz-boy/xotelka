const fs = require("fs");
const path = require("path");

const ORDERS_FILE = path.join(__dirname, "../data/orders.json");
const PACKAGES_FILE = path.join(__dirname, "../data/packages.json");

// ─── Read all orders ───────────────────────────────────────────
function getOrders() {
  const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
  return JSON.parse(raw);
}

// ─── Save all orders ───────────────────────────────────────────
function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

// ─── Add a new order ───────────────────────────────────────────
function addOrder(order) {
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  return order;
}

// ─── Find order by ID ──────────────────────────────────────────
function getOrderById(id) {
  return getOrders().find((o) => o.id === id) || null;
}

// ─── Update order status ───────────────────────────────────────
function updateOrderStatus(id, status, extra = {}) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], status, ...extra, updatedAt: new Date().toISOString() };
  saveOrders(orders);
  return orders[idx];
}

// ─── Get all packages ──────────────────────────────────────────
function getPackages() {
  const raw = fs.readFileSync(PACKAGES_FILE, "utf-8");
  return JSON.parse(raw);
}

// ─── Get package by ID ─────────────────────────────────────────
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
