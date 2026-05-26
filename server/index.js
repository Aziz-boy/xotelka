require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const { Telegraf } = require("telegraf");

const routes = require("./routes");
const { updateOrderStatus, getOrderById, getOrders } = require("./orders");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../webapp")));

const bot = new Telegraf(process.env.BOT_TOKEN);
app.set("bot", bot);

const ADMIN_GROUP_ID = process.env.ADMIN_GROUP_ID;

const STATUS_LABELS = {
  pending_payment:   "⏳ To'lov kutilmoqda",
  payment_submitted: "📤 Chek yuborildi — tekshirmoqda",
  confirmed:         "✅ Tasdiqlandi — tayyorlanmoqda",
  delivering:        "🚚 Yo'lda!",
  delivered:         "🎉 Yetkazildi!",
};

// ─── /start ───────────────────────────────────────────────────
bot.start(async (ctx) => {
  const firstName = ctx.from.first_name || "Do'stim";
  const userId    = String(ctx.from.id);
  const orders    = await getOrders();
  const active    = orders
    .filter(o => String(o.telegramUserId) === userId && o.status !== "delivered" && o.status !== "rejected")
    .slice(-1)[0];

  const keyboard = [[{ text: "🎁 Sovg'a tanlash", web_app: { url: process.env.WEBAPP_URL } }]];
  if (active) keyboard.push([{ text: "📍 Buyurtmam holati", callback_data: `status_${active.id}` }]);

  await ctx.reply(
    `Assalomu alaykum, ${firstName}! 👋\n\n` +
    `💝 <b>Noir Box</b> botiga xush kelibsiz!\n\n` +
    `Sovg'a buyurtma qilish uchun tugmani bosing 👇`,
    { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } }
  );
});

// ─── /status ──────────────────────────────────────────────────
bot.command("status", async (ctx) => {
  const userId = String(ctx.from.id);
  const orders = await getOrders();
  const active = orders
    .filter(o => String(o.telegramUserId) === userId && o.status !== "delivered" && o.status !== "rejected")
    .slice(-1)[0];

  if (!active) {
    return ctx.reply("Faol buyurtma topilmadi.", {
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

// ─── /orders (admin) ──────────────────────────────────────────
bot.command("orders", async (ctx) => {
  if (String(ctx.chat.id) !== String(ADMIN_GROUP_ID) &&
      String(ctx.from.id) !== String(ADMIN_GROUP_ID)) {
    // allow in private chat too for admins — just show last 10
  }
  const all    = await getOrders();
  const recent = [...all].reverse().slice(0, 10);

  if (!recent.length) return ctx.reply("Hali buyurtma yo'q.");

  const lines = recent.map(o =>
    `• <code>#${o.id.slice(0,8).toUpperCase()}</code> — ${o.packageName} | ${STATUS_LABELS[o.status] || o.status}`
  ).join("\n");

  await ctx.reply(`📋 <b>Oxirgi buyurtmalar:</b>\n\n${lines}`, { parse_mode: "HTML" });
});

// ─── Status refresh button ─────────────────────────────────────
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
  ).catch(() => {});
  await ctx.answerCbQuery("Yangilandi ✅");
});

// ─── Confirm order ─────────────────────────────────────────────
bot.action(/^confirm_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery("✅ Tasdiqlandi!").catch(() => {});

  try {
    const order = await getOrderById(ctx.match[1]);
    if (!order) return;

    await updateOrderStatus(order.id, "confirmed", {
      confirmedBy: ctx.from.username || String(ctx.from.id),
      confirmedAt: new Date().toISOString(),
    });

    // Update the receipt photo caption
    const byAdmin = "@" + (ctx.from.username || ctx.from.first_name);
    const oldCaption = ctx.callbackQuery.message?.caption || "";
    await ctx.editMessageCaption(
      oldCaption + "\n\n✅ TASDIQLANDI — " + byAdmin,
      { parse_mode: "HTML" }
    ).catch(() => {});

    // Notify buyer
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
      ).catch(() => {});
    }

    // Send delivery management to admin
    await bot.telegram.sendMessage(
      ADMIN_GROUP_ID,
      `🚀 <b>#${order.id.slice(0,8).toUpperCase()}</b> yetkazishga tayyor!\n\n` +
      `👧 ${order.recipientName}\n` +
      `📞 ${order.recipientPhone}\n` +
      `📍 ${order.recipientAddress}\n` +
      `📅 ${order.deliveryDate || "Kelishilgan vaqtda"}\n` +
      `💌 ${order.message || "—"}\n\n` +
      `Yetkazish holatini yangilang:`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "🚚 Yo'lga chiqdi",  callback_data: `deliver_${order.id}` },
            { text: "✅ Yetkazildi",      callback_data: `done_${order.id}` },
          ]]
        }
      }
    );
  } catch (e) {
    console.error("confirm_ error:", e);
  }
});

// ─── Reject order ──────────────────────────────────────────────
bot.action(/^reject_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery("❌ Rad etildi").catch(() => {});

  try {
    const order = await getOrderById(ctx.match[1]);
    if (!order) return;

    await updateOrderStatus(order.id, "rejected", {
      rejectedBy: ctx.from.username || String(ctx.from.id),
    });

    const byAdmin = "@" + (ctx.from.username || ctx.from.first_name);
    const oldCaption = ctx.callbackQuery.message?.caption || "";
    await ctx.editMessageCaption(
      oldCaption + "\n\n❌ RAD ETILDI — " + byAdmin,
      { parse_mode: "HTML" }
    ).catch(() => {});

    if (order.telegramUserId !== "unknown") {
      bot.telegram.sendMessage(
        order.telegramUserId,
        `❌ <b>To'lovingiz tasdiqlanmadi.</b>\n\nIltimos, to'lov chekini qayta tekshirib, aloqaga chiqing.`,
        { parse_mode: "HTML" }
      ).catch(() => {});
    }
  } catch (e) {
    console.error("reject_ error:", e);
  }
});

// ─── Mark as delivering ────────────────────────────────────────
bot.action(/^deliver_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery("🚚 Yetkazish boshlandi").catch(() => {});

  try {
    const order = await getOrderById(ctx.match[1]);
    if (!order) return;

    await updateOrderStatus(order.id, "delivering");

    // Replace buttons with just "done"
    await ctx.editMessageReplyMarkup({
      inline_keyboard: [[{ text: "✅ Yetkazildi", callback_data: `done_${order.id}` }]]
    }).catch(() => {});

    if (order.telegramUserId !== "unknown") {
      bot.telegram.sendMessage(
        order.telegramUserId,
        `🚚 <b>Sovg'angiz yo'lda!</b>\n\n${order.packageEmoji} ${order.packageName} yetkazilmoqda.\nTez orada yetib boradi 💝`,
        {
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: [[{ text: "📍 Buyurtma holati", callback_data: `status_${order.id}` }]] }
        }
      ).catch(() => {});
    }
  } catch (e) {
    console.error("deliver_ error:", e);
  }
});

// ─── Mark as delivered ─────────────────────────────────────────
bot.action(/^done_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery("🎉 Yetkazildi!").catch(() => {});

  try {
    const order = await getOrderById(ctx.match[1]);
    if (!order) return;

    await updateOrderStatus(order.id, "delivered", { deliveredAt: new Date().toISOString() });

    // Remove buttons from delivery management message
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});

    if (order.telegramUserId !== "unknown") {
      bot.telegram.sendMessage(
        order.telegramUserId,
        `🎉 <b>Sovg'a yetkazildi!</b>\n\n${order.packageEmoji} ${order.packageName} muvaffaqiyatli topshirildi.\n\nRahmat! 💝`,
        {
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: [[{ text: "🎁 Yangi buyurtma", web_app: { url: process.env.WEBAPP_URL } }]] }
        }
      ).catch(() => {});
    }
  } catch (e) {
    console.error("done_ error:", e);
  }
});

// ─── Receipt photo ─────────────────────────────────────────────
bot.on("photo", async (ctx) => {
  const userId = String(ctx.from.id);
  const orders = await getOrders();
  const order  = orders
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
    ADMIN_GROUP_ID,
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
          { text: "❌ Rad etish",  callback_data: `reject_${order.id}` },
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

// ─── Any other message ─────────────────────────────────────────
bot.on("message", async (ctx) => {
  const userId = String(ctx.from.id);
  const orders = await getOrders();
  const active = orders
    .filter(o => String(o.telegramUserId) === userId && o.status !== "delivered" && o.status !== "rejected")
    .slice(-1)[0];

  if (active?.status === "pending_payment") {
    return ctx.reply(
      `💳 To'lov qiling va chekni <b>rasm</b> sifatida yuboring.\n\nKarta: <code>${process.env.PAYMENT_CARD}</code>\nEgasi: ${process.env.PAYMENT_NAME}`,
      { parse_mode: "HTML" }
    );
  }

  if (active) {
    return ctx.reply(
      `📦 Buyurtmangiz holati: ${STATUS_LABELS[active.status] || active.status}\n\nYangilash uchun tugmani bosing:`,
      {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: "📍 Holat", callback_data: `status_${active.id}` }]] }
      }
    );
  }

  await ctx.reply(
    `Sovg'a buyurtma qilish uchun 👇`,
    { reply_markup: { inline_keyboard: [[{ text: "🎁 Sovg'a tanlash", web_app: { url: process.env.WEBAPP_URL } }]] } }
  );
});

// ─── API Routes ────────────────────────────────────────────────
app.use("/api", routes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../webapp/index.html"));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

bot.launch()
  .then(() => console.log("🤖 Bot started!"))
  .catch(err => {
    console.error("❌ Bot launch failed:", err.message);
    process.exit(1);
  });

// Keep Render.com free tier alive
if (process.env.WEBAPP_URL) {
  setInterval(() => {
    const mod = process.env.WEBAPP_URL.startsWith("https") ? require("https") : require("http");
    mod.get(process.env.WEBAPP_URL, () => {}).on("error", () => {});
  }, 14 * 60 * 1000);
}

process.once("SIGINT",  () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
