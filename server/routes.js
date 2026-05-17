const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const db = require("./orders");

// ─── Helper: format price ──────────────────────────────────────
const formatPrice = (p) => p.toLocaleString("uz-UZ") + " so'm";

// ─── GET /api/config ───────────────────────────────────────────
// Returns payment card info to the Web App
router.get("/config", (req, res) => {
  res.json({
    card: process.env.PAYMENT_CARD || "",
    name: process.env.PAYMENT_NAME || "",
  });
});

// ─── GET /api/packages ─────────────────────────────────────────
// Returns all gift packages (for the Web App to display)
router.get("/packages", (req, res) => {
  try {
    const packages = db.getPackages();
    res.json({ success: true, packages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/order ───────────────────────────────────────────
// Called by the Web App when buyer submits the order form
router.post("/order", async (req, res) => {
  try {
    const {
      telegramUserId,
      telegramUsername,
      packageId,
      recipientName,
      recipientPhone,
      recipientAddress,
      deliveryDate,
      deliveryTime,
      message,        // optional romantic message
      language,       // 'uz' or 'ru'
    } = req.body;

    // Validate required fields
    if (!packageId || !recipientName || !recipientPhone || !recipientAddress) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const pkg = db.getPackageById(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, error: "Package not found" });
    }

    const order = db.addOrder({
      id: uuidv4(),
      telegramUserId,
      telegramUsername,
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
      status: "pending_payment",   // pending_payment → payment_submitted → confirmed → delivering → delivered
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 🔔 Notify admin group via the bot
    const bot = req.app.get("bot");
    if (bot) {
      await notifyAdminNewOrder(bot, order, pkg);
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
// Called by Web App after buyer says they sent the payment receipt
router.post("/order/:id/payment-sent", async (req, res) => {
  try {
    const order = db.updateOrderStatus(req.params.id, "payment_submitted");
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });

    // Re-notify admin group that payment receipt is coming
    const bot = req.app.get("bot");
    if (bot) {
      const adminGroupId = process.env.ADMIN_GROUP_ID;
      await bot.telegram.sendMessage(
        adminGroupId,
        `💳 *To'lov cheki yuborildi!*\n\n` +
        `📦 Buyurtma: \`${order.id.slice(0, 8)}\`\n` +
        `👤 Xaridor: @${order.telegramUsername || order.telegramUserId}\n\n` +
        `Iltimos, chekni tekshiring va tasdiqlang yoki rad eting 👇`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Tasdiqlash", callback_data: `confirm_${order.id}` },
                { text: "❌ Rad etish", callback_data: `reject_${order.id}` },
              ],
            ],
          },
        }
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/order/:id ────────────────────────────────────────
// Buyer can poll this to check their order status
router.get("/order/:id", (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ success: false, error: "Order not found" });
  res.json({ success: true, order });
});

// ─── GET /api/orders ───────────────────────────────────────────
// Admin: get all orders (simple list)
router.get("/orders", (req, res) => {
  try {
    const orders = db.getOrders().reverse(); // newest first
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

  const text =
    `🎁 *YANGI BUYURTMA!*\n\n` +
    `${pkg.emoji} *${pkg.name_uz}* — ${order.price.toLocaleString()} so'm\n\n` +
    `👤 *Xaridor:* @${order.telegramUsername || "noma'lum"} (ID: ${order.telegramUserId})\n` +
    `👧 *Qabul qiluvchi:* ${order.recipientName}\n` +
    `📞 *Tel:* ${order.recipientPhone}\n` +
    `📍 *Manzil:* ${order.recipientAddress}\n` +
    `📅 *Yetkazish:* ${order.deliveryDate || "Ko'rsatilmagan"} ${order.deliveryTime || ""}\n` +
    `💌 *Xabar:* ${order.message || "—"}\n\n` +
    `🆔 Buyurtma ID: \`${order.id.slice(0, 8)}\`\n\n` +
    `⏳ To'lov cheki kutilmoqda...`;

  await bot.telegram.sendMessage(adminGroupId, text, { parse_mode: "Markdown" });

  // Also send payment instructions reminder to admin
  await bot.telegram.sendMessage(
    adminGroupId,
    `💳 Karta: \`${card}\`\n👤 ${cardName}\n\nXaridor to'lov qilgandan so'ng chek yuboradi.`,
    { parse_mode: "Markdown" }
  );
}

module.exports = router;
