require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Telegraf } = require("telegraf");

const routes = require("./routes");
const { updateOrderStatus, getOrderById, getOrders } = require("./orders");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../webapp")));

const bot = new Telegraf(process.env.BOT_TOKEN);
app.set("bot", bot);

const STATUS_LABELS = {
  pending_payment:   "⏳ To'lov kutilmoqda",
  payment_submitted: "📤 Chek yuborildi — admin tekshirmoqda",
  confirmed:         "✅ Tasdiqlandi — tayyorlanmoqda",
  delivering:        "🚚 Yo'lda!",
  delivered:         "🎉 Yetkazildi!",
};

// ─── Bot: /start ───────────────────────────────────────────────
bot.start(async (ctx) => {
  const firstName = ctx.from.first_name || "Do'stim";
  const userId = String(ctx.from.id);
  const orders = await getOrders();
  const active = orders
    .filter(o => String(o.telegramUserId) === userId && o.status !== "delivered" && o.status !== "rejected")
    .slice(-1)[0];

  const keyboard = [[{ text: "🎁 Sovg'a tanlash", web_app: { url: process.env.WEBAPP_URL } }]];
  if (active) keyboard.push([{ text: "📍 Buyurtmam holati", callback_data: `status_${active.id}` }]);

  await ctx.reply(
    `Assalomu alaykum, ${firstName}! 👋\n\n` +
    `💝 <b>Sevgili sovg'a</b> botiga xush kelibsiz!\n\n` +
    `Sovg'a buyurtma qilish uchun tugmani bosing 👇`,
    { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } }
  );
});

// ─── Bot: /status command ──────────────────────────────────────
bot.command("status", async (ctx) => {
  const userId = String(ctx.from.id);
  const orders = await getOrders();
  const active = orders
    .filter(o => String(o.telegramUserId) === userId && o.status !== "delivered" && o.status !== "rejected")
    .slice(-1)[0];

  if (!active) {
    return ctx.reply("Faol buyurtma topilmadi. Yangi buyurtma berish uchun 👇", {
      reply_markup: { inline_keyboard: [[{ text: "🎁 Sovg'a tanlash", web_app: { url: process.env.WEBAPP_URL } }]] }
    });
  }

  await ctx.reply(
    `📦 <b>Buyurtma holati</b>\n\n` +
    `ID: <code>#${active.id.slice(0,8).toUpperCase()}</code>\n` +
    `Sovg'a: ${active.packageEmoji} ${active.packageName}\n` +
    `Summa: <b>${active.price.toLocaleString()} so'm</b>\n\n` +
    `Holat: ${STATUS_LABELS[active.status] || active.status}`,
    {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "🔄 Yangilash", callback_data: `status_${active.id}` }]] }
    }
  );
});

// ─── Bot: Status refresh button ────────────────────────────────
bot.action(/^status_(.+)$/, async (ctx) => {
  const order = await getOrderById(ctx.match[1]);
  if (!order) return ctx.answerCbQuery("Buyurtma topilmadi");

  await ctx.editMessageText(
    `📦 <b>Buyurtma holati</b>\n\n` +
    `ID: <code>#${order.id.slice(0,8).toUpperCase()}</code>\n` +
    `Sovg'a: ${order.packageEmoji} ${order.packageName}\n` +
    `Summa: <b>${order.price.toLocaleString()} so'm</b>\n\n` +
    `Holat: ${STATUS_LABELS[order.status] || order.status}`,
    {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "🔄 Yangilash", callback_data: `status_${order.id}` }]] }
    }
  );
  await ctx.answerCbQuery("Yangilandi ✅");
});

// ─── Bot: Confirm order ────────────────────────────────────────
bot.action(/^confirm_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery("✅ Tasdiqlandi!").catch(() => {});

  try {
    const order = await getOrderById(ctx.match[1]);
    if (!order) return;

    await updateOrderStatus(order.id, "confirmed", {
      confirmedBy: ctx.from.username || ctx.from.id,
      confirmedAt: new Date().toISOString(),
    });

    const byAdmin = "@" + (ctx.from.username || ctx.from.first_name);
    const oldCaption = ctx.callbackQuery.message?.caption || "";
    await ctx.editMessageCaption(
      oldCaption + "\n\n✅ TASDIQLANDI — " + byAdmin,
      { parse_mode: "HTML" }
    ).catch(e => console.error("editMessageCaption (confirm) failed:", e.message));

    if (order.telegramUserId !== "unknown") {
      bot.telegram.sendMessage(
        order.telegramUserId,
        `✅ <b>Buyurtmangiz tasdiqlandi!</b>\n\n` +
        `${order.packageEmoji} ${order.packageName}\n` +
        `📍 ${order.recipientAddress}\n` +
        `📅 ${order.deliveryDate || "Tez orada"}\n\n` +
        `Yetkazish haqida xabar beramiz 💝`,
        {
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: [[{ text: "📍 Buyurtma holati", callback_data: `status_${order.id}` }]] }
        }
      ).catch(e => console.error("Buyer notify error:", e.message));
    }
  } catch (e) {
    console.error("confirm_ handler error:", e);
  }
});

// ─── Bot: Reject order ─────────────────────────────────────────
bot.action(/^reject_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery("❌ Rad etildi").catch(() => {});

  try {
    const order = await getOrderById(ctx.match[1]);
    if (!order) return;

    await updateOrderStatus(order.id, "rejected", { rejectedBy: ctx.from.username || ctx.from.id });

    const byAdmin = "@" + (ctx.from.username || ctx.from.first_name);
    const oldCaption = ctx.callbackQuery.message?.caption || "";
    await ctx.editMessageCaption(
      oldCaption + "\n\n❌ RAD ETILDI — " + byAdmin,
      { parse_mode: "HTML" }
    ).catch(e => console.error("editMessageCaption (reject) failed:", e.message));

    if (order.telegramUserId !== "unknown") {
      bot.telegram.sendMessage(
        order.telegramUserId,
        `❌ <b>To'lovingiz tasdiqlanmadi.</b>\n\n` +
        `Iltimos, to'lov chekini qayta tekshirib, @azizbek_hakimov ga murojaat qiling.`,
        { parse_mode: "HTML" }
      ).catch(e => console.error("Buyer notify error:", e.message));
    }
  } catch (e) {
    console.error("reject_ handler error:", e);
  }
});

// ─── Bot: Mark as delivering ───────────────────────────────────
bot.action(/^deliver_(.+)$/, async (ctx) => {
  const order = await getOrderById(ctx.match[1]);
  if (!order) return ctx.answerCbQuery("Buyurtma topilmadi!");

  await updateOrderStatus(order.id, "delivering");

  if (order.telegramUserId !== "unknown") {
    bot.telegram.sendMessage(
      order.telegramUserId,
      `🚚 <b>Sovg'angiz yo'lda!</b>\n\n${order.packageEmoji} ${order.packageName} yetkazilmoqda.\n\nTez orada yetib boradi 💝`,
      {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: "📍 Buyurtma holati", callback_data: `status_${order.id}` }]] }
      }
    ).catch(() => {});
  }

  await ctx.answerCbQuery("🚚 Yetkazish boshlandi");
});

// ─── Bot: Mark as delivered ────────────────────────────────────
bot.action(/^done_(.+)$/, async (ctx) => {
  const order = await getOrderById(ctx.match[1]);
  if (!order) return ctx.answerCbQuery("Buyurtma topilmadi!");

  await updateOrderStatus(order.id, "delivered", { deliveredAt: new Date().toISOString() });

  if (order.telegramUserId !== "unknown") {
    bot.telegram.sendMessage(
      order.telegramUserId,
      `🎉 <b>Sovg'a yetkazildi!</b>\n\n${order.packageEmoji} ${order.packageName} muvaffaqiyatli topshirildi.\n\nRahmat! 💝`,
      { parse_mode: "HTML" }
    ).catch(() => {});
  }

  await ctx.answerCbQuery("✅ Yetkazildi!");
});

// ─── Bot: Receive receipt photo ────────────────────────────────
bot.on("photo", async (ctx) => {
  const userId = String(ctx.from.id);
  const orders = await getOrders();
  const order = orders
    .filter(o => String(o.telegramUserId) === userId && o.status === "payment_submitted")
    .slice(-1)[0];

  if (!order) {
    return ctx.reply(
      "Hozirda to'lov kutilayotgan buyurtma topilmadi.\n\nAvval buyurtma bering va 'Chekni yuborish' tugmasini bosing.",
      { reply_markup: { inline_keyboard: [[{ text: "🎁 Yangi buyurtma", web_app: { url: process.env.WEBAPP_URL } }]] } }
    );
  }

  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  await bot.telegram.sendPhoto(
    process.env.ADMIN_GROUP_ID,
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
    `✅ <b>Chek qabul qilindi!</b>\n\nAdmin tez orada tekshiradi. Holat o'zgarganda xabar olasiz 🔔`,
    {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "📍 Buyurtma holati", callback_data: `status_${order.id}` }]] }
    }
  );
});

// ─── API Routes ────────────────────────────────────────────────
app.use("/api", routes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../webapp/index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

bot.launch().then(() => console.log("🤖 Bot started!"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
