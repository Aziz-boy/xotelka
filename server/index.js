require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Telegraf } = require("telegraf");

const routes = require("./routes");
const { updateOrderStatus, getOrderById } = require("./orders");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Serve Web App static files ────────────────────────────────
app.use(express.static(path.join(__dirname, "../webapp")));

// ─── Initialize Bot ────────────────────────────────────────────
const bot = new Telegraf(process.env.BOT_TOKEN);
app.set("bot", bot);

// ─── Bot: /start command ───────────────────────────────────────
bot.start(async (ctx) => {
  const firstName = ctx.from.first_name || "Do'stim";
  await ctx.reply(
    `Assalomu alaykum, ${firstName}! 👋\n\n` +
    `💝 *Sevgili sovg'a* botiga xush kelibsiz!\n\n` +
    `Sevgiliningizga maxfiy va ajoyib sovg'a yetkazib berish uchun tugmani bosing 👇`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🎁 Sovg'a tanlash",
              web_app: { url: process.env.WEBAPP_URL },
            },
          ],
        ],
      },
    }
  );
});

// ─── Bot: Admin inline button handlers ────────────────────────
bot.action(/^confirm_(.+)$/, async (ctx) => {
  const orderId = ctx.match[1];
  const order = getOrderById(orderId);
  if (!order) return ctx.answerCbQuery("Buyurtma topilmadi!");

  // Update status
  updateOrderStatus(orderId, "confirmed", {
    confirmedBy: ctx.from.username || ctx.from.id,
    confirmedAt: new Date().toISOString(),
  });

  // Edit admin message
  await ctx.editMessageText(
    ctx.callbackQuery.message.text + "\n\n✅ *TASDIQLANDI* — " + (ctx.from.username || ctx.from.first_name),
    { parse_mode: "Markdown" }
  );

  // Notify buyer
  try {
    await bot.telegram.sendMessage(
      order.telegramUserId,
      `✅ *Buyurtmangiz tasdiqlandi!*\n\n` +
      `${order.packageEmoji} ${order.packageName}\n\n` +
      `📍 Manzil: ${order.recipientAddress}\n` +
      `📅 Yetkazish: ${order.deliveryDate || "Tez orada"}\n\n` +
      `Yetkazib berish vaqti haqida xabar beramiz. Rahmat! 💝`,
      { parse_mode: "Markdown" }
    );
  } catch (e) {
    console.error("Could not notify buyer:", e.message);
  }

  await ctx.answerCbQuery("✅ Tasdiqlandi!");
});

bot.action(/^reject_(.+)$/, async (ctx) => {
  const orderId = ctx.match[1];
  const order = getOrderById(orderId);
  if (!order) return ctx.answerCbQuery("Buyurtma topilmadi!");

  updateOrderStatus(orderId, "rejected", {
    rejectedBy: ctx.from.username || ctx.from.id,
  });

  await ctx.editMessageText(
    ctx.callbackQuery.message.text + "\n\n❌ *RAD ETILDI* — " + (ctx.from.username || ctx.from.first_name),
    { parse_mode: "Markdown" }
  );

  try {
    await bot.telegram.sendMessage(
      order.telegramUserId,
      `❌ *To'lovingiz tasdiqlanmadi.*\n\n` +
      `Iltimos, to'lov chekini qayta tekshirib, @admin ga murojaat qiling.`,
      { parse_mode: "Markdown" }
    );
  } catch (e) {
    console.error("Could not notify buyer:", e.message);
  }

  await ctx.answerCbQuery("❌ Rad etildi");
});

// ─── Bot: Mark as delivering ───────────────────────────────────
bot.action(/^deliver_(.+)$/, async (ctx) => {
  const orderId = ctx.match[1];
  const order = getOrderById(orderId);
  if (!order) return ctx.answerCbQuery("Buyurtma topilmadi!");

  updateOrderStatus(orderId, "delivering");

  try {
    await bot.telegram.sendMessage(
      order.telegramUserId,
      `🚚 *Sovg'angiz yo'lda!*\n\n` +
      `${order.packageEmoji} ${order.packageName} hozir yetkazilmoqda.\n\n` +
      `Tez orada yetib boradi 💝`,
      { parse_mode: "Markdown" }
    );
  } catch (e) {}

  await ctx.answerCbQuery("🚚 Yetkazish boshlandi");
});

// ─── Bot: Mark as delivered ────────────────────────────────────
bot.action(/^done_(.+)$/, async (ctx) => {
  const orderId = ctx.match[1];
  const order = getOrderById(orderId);
  if (!order) return ctx.answerCbQuery("Buyurtma topilmadi!");

  updateOrderStatus(orderId, "delivered", { deliveredAt: new Date().toISOString() });

  try {
    await bot.telegram.sendMessage(
      order.telegramUserId,
      `🎉 *Sovg'a yetkazildi!*\n\n` +
      `${order.packageEmoji} ${order.packageName} muvaffaqiyatli topshirildi.\n\n` +
      `Bizga ishonganingiz uchun katta rahmat! 💝\n` +
      `Keyingi sovg'a uchun yana keling 😊`,
      { parse_mode: "Markdown" }
    );
  } catch (e) {}

  await ctx.answerCbQuery("✅ Yetkazildi!");
});

// ─── API Routes ────────────────────────────────────────────────
app.use("/api", routes);

// ─── Serve Web App for all other routes ────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../webapp/index.html"));
});

// ─── Start server + bot ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🌐 Web App: ${process.env.WEBAPP_URL}`);
});

bot.launch().then(() => {
  console.log("🤖 Bot started!");
});

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
