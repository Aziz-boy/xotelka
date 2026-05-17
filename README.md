# 💝 Sevgili Sovg'a — Gift Bot

Surprise gift delivery Telegram bot for couples in Uzbekistan.
Built with Node.js, Telegraf, Express, and a Telegram Web App.

---

## 📁 Project Structure

```
gift-bot/
├── server/
│   ├── index.js        ← Main server + bot logic + admin actions
│   ├── routes.js       ← Express API routes
│   └── orders.js       ← JSON database read/write
├── webapp/
│   └── index.html      ← Full Web App UI (dark luxury, UZ+RU)
├── data/
│   ├── packages.json   ← Gift packages (edit prices/names here)
│   └── orders.json     ← All orders stored here
├── .env.example        ← Copy this to .env and fill in values
├── package.json
└── README.md
```

---

## 🚀 Setup (Step by Step)

### 1. Install Node.js
Download from https://nodejs.org (v18 or higher)

### 2. Create your Telegram Bot
1. Open Telegram → search **@BotFather**
2. Send `/newbot`
3. Give it a name: e.g. `Sevgili Sovg'a`
4. Give it a username: e.g. `@sevgili_sovga_bot`
5. Copy the **token** it gives you

### 3. Create Admin Group
1. Create a Telegram group (e.g. "🎁 Gift Admin")
2. Add your bot to this group
3. Make the bot an **admin** of the group
4. Get the group ID:
   - Add @userinfobot to the group temporarily
   - It will print the group ID (a negative number like -1001234567890)

### 4. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
BOT_TOKEN=7123456789:AAF...your_token...
ADMIN_GROUP_ID=-1001234567890
PORT=3000
WEBAPP_URL=https://your-server.com
PAYMENT_CARD=8600 1234 5678 9012
PAYMENT_NAME=Your Full Name
```

### 5. Install dependencies
```bash
npm install
```

### 6. Host the Web App (required for Telegram)
Telegram Web Apps **must be served over HTTPS**.

**Option A — Free (recommended for start):**
- Use [Railway](https://railway.app) or [Render](https://render.com)
- Connect your GitHub repo → deploy
- They give you a free HTTPS URL

**Option B — VPS:**
- Use nginx + Let's Encrypt SSL
- Point your domain to the server

### 7. Set Web App URL in BotFather
1. Go to @BotFather → `/mybots` → your bot
2. Select **Bot Settings** → **Menu Button**
3. Set URL to your `WEBAPP_URL`
4. Set button text: `🎁 Sovg'a tanlash`

### 8. Start the bot
```bash
npm start
```

---

## 📱 Order Flow

```
Boyfriend opens bot
       ↓
Taps "🎁 Sovg'a tanlash" button
       ↓
Web App opens (dark luxury UI)
       ↓
Selects gift package
       ↓
Fills recipient info (name, phone, address, date, message)
       ↓
Sees order summary + payment card number
       ↓
Places order → Admin group gets notified
       ↓
Buyer sends payment receipt to @admin personally
       ↓
Admin group gets "payment submitted" alert
       ↓
Admin taps ✅ Confirm or ❌ Reject (inline buttons)
       ↓
Buyer gets Telegram notification
       ↓
Admin marks as 🚚 Delivering → then ✅ Delivered
       ↓
Buyer gets final notification 🎉
```

---

## 🛠 Admin Actions (in group chat)

When a new order arrives, the bot posts to your admin group with:
- Full order details (package, recipient, address, date)
- After payment receipt sent: **✅ Tasdiqlash** / **❌ Rad etish** buttons

You can also later add:
- `/orders` command to list all orders
- Mark as delivering / delivered buttons

---

## 💰 Editing Gift Packages & Prices

Edit `data/packages.json` — change name, description, or price:

```json
{
  "id": "flowers",
  "emoji": "🌸",
  "name_uz": "Gullar to'plami",
  "name_ru": "Букет цветов",
  "price": 120000
}
```

Price is in **Uzbek so'm** (120000 = 120,000 so'm).

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `telegraf` | Telegram Bot framework |
| `express` | Web server / API |
| `cors` | Cross-origin requests |
| `dotenv` | Environment variables |
| `uuid` | Unique order IDs |
| `multer` | (ready for file uploads later) |

---

## 🔜 Future Features (Phase 2)

- [ ] Payme / Click payment integration
- [ ] Admin dashboard web panel
- [ ] Order tracking page for buyer
- [ ] Multiple cities support
- [ ] Promo codes / discounts
- [ ] Customer reviews
