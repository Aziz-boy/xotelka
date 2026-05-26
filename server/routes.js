const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const db = require("./orders");

const formatPrice = (p) => p.toLocaleString("uz-UZ") + " so'm";

// ─── GET /api/config ───────────────────────────────────────────
router.get("/config", (req, res) => {
  res.json({
    card: process.env.PAYMENT_CARD || "",
    name: process.env.PAYMENT_NAME || "",
  });
});

// ─── GET /api/packages ─────────────────────────────────────────
router.get("/packages", (req, res) => {
  try {
    const packages = db.getPackages();
    res.json({ success: true, packages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/order ───────────────────────────────────────────
router.post("/order", async (req, res) => {
  try {
    const {
      telegramUserId, telegramUsername, packageId,
      recipientName, recipientPhone, recipientAddress,
      deliveryDate, deliveryTime, message, language,
    } = req.body;

    if (!packageId || !recipientName || !recipientPhone || !recipientAddress) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const pkg = db.getPackageById(packageId);
    if (!pkg) return res.status(404).json({ success: false, error: "Package not found" });

    const order = await db.addOrder({
      id: uuidv4(),
      telegramUserId: String(telegramUserId || "unknown"),
      telegramUsername: telegramUsername || "",
      packageId,
      packageName: pkg.name_uz,
      packageEmoji: pkg.emoji,
      price: pkg.price,
      recipientName,
      recipientPhone,
      recipientAddress,
      deliveryDate: deliveryDate || null,
      deliveryTime: deliveryTime || null,
      message: message || "",
      language: language || "uz",
      status: "pending_payment",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const bot = req.app.get("bot");
    if (bot) {
      notifyAdminNewOrder(bot, order, pkg).catch(err =>
        console.error("Admin notify failed:", err.message)
      );
    }

    res.json({
      success: true,
      orderId: order.id,
      price: order.price,
      formattedPrice: formatPrice(order.price),
    });
  } catch (err) {
    console.error("POST /order error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/order/:id/payment-sent ──────────────────────────
router.post("/order/:id/payment-sent", async (req, res) => {
  try {
    const order = await db.updateOrderStatus(req.params.id, "payment_submitted");
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });

    const bot = req.app.get("bot");
    if (bot && order.telegramUserId !== "unknown") {
      bot.telegram.sendMessage(
        order.telegramUserId,
        `📸 <b>To'lov chekini yuboring!</b>\n\n` +
        `Iltimos, to'lov chekini <b>rasm (photo)</b> sifatida shu botga yuboring.\n\n` +
        `Buyurtma: <code>#${order.id.slice(0, 8).toUpperCase()}</code>\n` +
        `Summa: <b>${order.price.toLocaleString()} so'm</b>`,
        { parse_mode: "HTML" }
      ).catch(err => console.error("Could not message user:", err.message));
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/order/:id ────────────────────────────────────────
router.get("/order/:id", async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/orders ───────────────────────────────────────────
router.get("/orders", async (req, res) => {
  try {
    const orders = (await db.getOrders()).reverse();
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Notify admin group about new order ────────────────────────
async function notifyAdminNewOrder(bot, order, pkg) {
  const adminGroupId = process.env.ADMIN_GROUP_ID;
  const card = process.env.PAYMENT_CARD;
  const cardName = process.env.PAYMENT_NAME;

  await bot.telegram.sendMessage(
    adminGroupId,
    `🎁 <b>YANGI BUYURTMA!</b>\n\n` +
    `${pkg.emoji} <b>${pkg.name_uz}</b> — ${order.price.toLocaleString()} so'm\n\n` +
    `👤 <b>Xaridor:</b> @${order.telegramUsername || "noma'lum"} (ID: ${order.telegramUserId})\n` +
    `👧 <b>Qabul qiluvchi:</b> ${order.recipientName}\n` +
    `📞 <b>Tel:</b> ${order.recipientPhone}\n` +
    `📍 <b>Manzil:</b> ${order.recipientAddress}\n` +
    `📅 <b>Yetkazish:</b> ${order.deliveryDate || "Ko'rsatilmagan"} ${order.deliveryTime || ""}\n` +
    `💌 <b>Xabar:</b> ${order.message || "—"}\n\n` +
    `🆔 ID: <code>${order.id.slice(0, 8)}</code>\n\n` +
    `⏳ To'lov cheki kutilmoqda...`,
    { parse_mode: "HTML" }
  );

  await bot.telegram.sendMessage(
    adminGroupId,
    `💳 Karta: <code>${card}</code>\n👤 ${cardName}\n\nXaridor to'lov qilgandan so'ng chek yuboradi.`,
    { parse_mode: "HTML" }
  );
}

module.exports = router;
