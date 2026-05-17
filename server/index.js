require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Telegraf } = require("telegraf");

const routes = require("./routes");
const { updateOrderStatus, getOrderById, getOrders } = require("./orders");

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
  const userId = String(ctx.from.id);
  const orders = getOrders();
  const active = orders
    .filter(o => String(o.telegramUserId) === userId && o.status !== "delivered" && o.status !== "rejected")
    .slice(-1)[0];

  const keyboard = [[{ text: "🎁 Sovg'a tanlash", web_app: { url: process.env.WEBAPP_URL } }]];
  if (active) {
    keyboard.push([{ text: "📍 Buyurtmam holati", callback_data: `status_${active.id}` }]);
  }

  await ctx.reply(
    `Assalomu alaykum, ${firstName}! 👋\n\n` +
    `💝 <b>Sevgili sovg'a</b> botiga xush kelibsiz!\n\n` +
    `Sevgiliningizga maxfiy va ajoyib sovg'a yetkazib berish uchun tugmani bosing 👇`,
    { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } }
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
    ctx.callbackQuery.message.text + "\n\n✅ <b>TASDIQLANDI</b> — " + (ctx.from.username || ctx.from.first_name),
    { parse_mode: "HTML" }
  );

  // Notify buyer
  try {
    await bot.telegram.sendMessage(
      order.telegramUserId,
      `✅ <b>Buyurtmangiz tasdiqlandi!</b>\n\n` +
      `${order.packageEmoji} ${order.packageName}\n\n` +
      `📍 Manzil: ${order.recipientAddress}\n` +
      `📅 Yetkazish: ${order.deliveryDate || "Tez orada"}\n\n` +
      `Yetkazib berish vaqti haqida xabar beramiz. Rahmat! 💝`,
      { parse_mode: "HTML" }
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
    ctx.callbackQuery.message.text + "\n\n❌ <b>RAD ETILDI</b> — " + (ctx.from.username || ctx.from.first_name),
    { parse_mode: "HTML" }
  );

  try {
    await bot.telegram.sendMessage(
      order.telegramUserId,
      `❌ <b>To'lovingiz tasdiqlanmadi.</b>\n\n` +
      `Iltimos, to'lov chekini qayta tekshirib, @azizbek_hakimov ga murojaat qiling.`,
      { parse_mode: "HTML" }
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
      `🚚 <b>Sovg'angiz yo'lda!</b>\n\n` +
      `${order.packageEmoji} ${order.packageName} hozir yetkazilmoqda.\n\n` +
      `Tez orada yetib boradi 💝`,
      { parse_mode: "HTML" }
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
      `🎉 <b>Sovg'a yetkazildi!</b>\n\n` +
      `${order.packageEmoji} ${order.packageName} muvaffaqiyatli topshirildi.\n\n` +
      `Bizga ishonganingiz uchun katta rahmat! 💝\n` +
      `Keyingi sovg'a uchun yana keling 😊`,
      { parse_mode: "HTML" }
    );
  } catch (e) {}

  await ctx.answerCbQuery("✅ Yetkazildi!");
});

// ─── Bot: /status command ──────────────────────────────────────
bot.command("status", async (ctx) => {
  const userId = String(ctx.from.id);
  const orders = getOrders();
  const active = orders
    .filter(o => String(o.telegramUserId) === userId && o.status !== "delivered" && o.status !== "rejected")
    .slice(-1)[0];

  if (!active) {
    return ctx.reply("Faol buyurtma topilmadi. Yangi buyurtma berish uchun quyidagi tugmani bosing 👇", {
      reply_markup: { inline_keyboard: [[{ text: "🎁 Sovg'a tanlash", web_app: { url: process.env.WEBAPP_URL } }]] }
    });
  }

  const statusLabels = {
    pending_payment:   "⏳ To'lov kutilmoqda",
    payment_submitted: "📤 Chek yuborildi — admin tekshirmoqda",
    confirmed:         "✅ Tasdiqlandi — tayyorlanmoqda",
    delivering:        "🚚 Yo'lda!",
    delivered:         "🎉 Yetkazildi!",
  };

  await ctx.reply(
    `📦 <b>Buyurtma holati</b>\n\n` +
    `ID: <code>#${active.id.slice(0,8).toUpperCase()}</code>\n` +
    `Sovg'a: ${active.packageEmoji} ${active.packageName}\n` +
    `Summa: <b>${active.price.toLocaleString()} so'm</b>\n\n` +
    `Holat: ${statusLabels[active.status] || active.status}`,
    {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "🔄 Statusni yangilash", callback_data: `status_${active.id}` }]] }
    }
  );
});

// ─── Bot: Status refresh button ────────────────────────────────
bot.action(/^status_(.+)$/, async (ctx) => {
  const order = getOrderById(ctx.match[1]);
  if (!order) return ctx.answerCbQuery("Buyurtma topilmadi");
  const statusLabels = {
    pending_payment:   "⏳ To'lov kutilmoqda",
    payment_submitted: "📤 Chek yuborildi — admin tekshirmoqda",
    confirmed:         "✅ Tasdiqlandi — tayyorlanmoqda",
    delivering:        "🚚 Yo'lda!",
    delivered:         "🎉 Yetkazildi!",
  };
  await ctx.editMessageText(
    `📦 <b>Buyurtma holati</b>\n\n` +
    `ID: <code>#${order.id.slice(0,8).toUpperCase()}</code>\n` +
    `Sovg'a: ${order.packageEmoji} ${order.packageName}\n` +
    `Summa: <b>${order.price.toLocaleString()} so'm</b>\n\n` +
    `Holat: ${statusLabels[order.status] || order.status}`,
    {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "🔄 Statusni yangilash", callback_data: `status_${order.id}` }]] }
    }
  );
  await ctx.answerCbQuery("Yangilandi ✅");
});

// ─── Bot: Receive receipt photo from user ──────────────────────
bot.on("photo", async (ctx) => {
  const userId = String(ctx.from.id);
  const orders = getOrders();
  const order = orders
    .filter(o => String(o.telegramUserId) === userId && o.status === "payment_submitted")
    .slice(-1)[0];

  if (!order) {
    return ctx.reply("Hozirda to'lov kutilayotgan buyurtma topilmadi.");
  }

  const adminGroupId = process.env.ADMIN_GROUP_ID;
  const photo = ctx.message.photo[ctx.message.photo.length - 1];

  // Forward photo to admin group with confirm/reject buttons
  await bot.telegram.sendPhoto(
    adminGroupId,
    photo.file_id,
    {
      caption:
        `💳 <b>To'lov cheki keldi!</b>\n\n` +
        `📦 <code>#${order.id.slice(0,8).toUpperCase()}</code>\n` +
        `${order.packageEmoji} ${order.packageName} — ${order.price.toLocaleString()} so'm\n` +
        `👤 @${order.telegramUsername || order.telegramUserId}\n` +
        `👧 ${order.recipientName} | ${order.recipientPhone}\n` +
        `📍 ${order.recipientAddress}`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "✅ Tasdiqlash", callback_data: `confirm_${order.id}` },
          { text: "❌ Rad etish", callback_data: `reject_${order.id}` },
        ]],
      },
    }
  );

  await ctx.reply(
    `✅ <b>Chek qabul qilindi!</b>\n\nAdmin tez orada tekshiradi. Holat o'zgarganda xabar beramiz 🔔`,
    {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "📍 Buyurtma holati", callback_data: `status_${order.id}` }]] }
    }
  );
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
