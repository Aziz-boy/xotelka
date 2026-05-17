// ── Telegram Web App init ─────────────────────────────────
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.setHeaderColor('#0d0d0d');
}

const tgUser = tg?.initDataUnsafe?.user || {};

// ── State ─────────────────────────────────────────────────
let lang = 'uz';
let selectedPkg = null;
let packages = [];
let currentOrder = null;
let trackingInterval = null;

// ── Language ──────────────────────────────────────────────
function setLang(l) {
  lang = l;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.lang-btn[onclick="setLang('${l}')"]`).classList.add('active');
  document.querySelectorAll('[data-uz]').forEach(el => {
    el.textContent = el.getAttribute(`data-${l}`);
  });
  document.querySelectorAll('[data-ph-uz]').forEach(el => {
    el.placeholder = el.getAttribute(`data-ph-${l}`);
  });
  if (packages.length) renderPackages();
}

// ── Screens ───────────────────────────────────────────────
function goToScreen(n) {
  if (n !== 4 && trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  document.querySelectorAll('.screen').forEach((s, i) => {
    s.classList.toggle('active', i === n);
  });
  document.querySelectorAll('.step-dot').forEach((d, i) => {
    d.classList.remove('active', 'done');
    if (i < n) d.classList.add('done');
    else if (i === n) d.classList.add('active');
  });
  if (n === 2) buildSummary();
  window.scrollTo(0, 0);
}

// ── Load packages ─────────────────────────────────────────
async function loadPackages() {
  const grid = document.getElementById('packages-grid');
  grid.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Yuklanmoqda...</p>';
  try {
    const res = await fetch('/api/packages');
    const data = await res.json();
    packages = data.packages;
    renderPackages();
  } catch (e) {
    grid.innerHTML = '<p style="color:#e8516a;text-align:center;padding:20px">⚠️ Server bilan ulanishda xatolik. Iltimos, qayta urinib ko\'ring.</p>';
  }
}

function renderPackages() {
  const grid = document.getElementById('packages-grid');
  grid.innerHTML = packages.map(pkg => `
    <div class="pkg-card ${selectedPkg?.id === pkg.id ? 'selected' : ''}"
         onclick="selectPkg('${pkg.id}')">
      <div class="check">✓</div>
      <span class="emoji">${pkg.emoji}</span>
      <div class="pkg-name">${lang === 'uz' ? pkg.name_uz : pkg.name_ru}</div>
      <div class="pkg-desc">${lang === 'uz' ? pkg.desc_uz : pkg.desc_ru}</div>
      <div class="pkg-price">${pkg.price.toLocaleString()} so'm</div>
    </div>
  `).join('');
}

function selectPkg(id) {
  selectedPkg = packages.find(p => p.id === id);
  renderPackages();
  document.getElementById('btn-next-0').disabled = false;
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ── Validate recipient form ────────────────────────────────
function validateAndNext() {
  const name = document.getElementById('recipientName').value.trim();
  const phone = document.getElementById('recipientPhone').value.trim();
  const address = document.getElementById('recipientAddress').value.trim();
  if (!name || !phone || !address) {
    showToast(lang === 'uz' ? "⚠️ Barcha majburiy maydonlarni to'ldiring" : '⚠️ Заполните все обязательные поля');
    return;
  }
  goToScreen(2);
}

// ── Build summary ─────────────────────────────────────────
function buildSummary() {
  const pkg = selectedPkg;
  const name = document.getElementById('recipientName').value;
  const phone = document.getElementById('recipientPhone').value;
  const address = document.getElementById('recipientAddress').value;
  const date = document.getElementById('deliveryDate').value;
  const time = document.getElementById('deliveryTime').value;
  const msg = document.getElementById('message').value;

  document.getElementById('summary-card').innerHTML = `
    <div class="summary-row">
      <span class="summary-label">${lang === 'uz' ? "Sovg'a" : 'Подарок'}</span>
      <span class="summary-value">${pkg.emoji} ${lang === 'uz' ? pkg.name_uz : pkg.name_ru}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">${lang === 'uz' ? 'Ismi' : 'Имя'}</span>
      <span class="summary-value">${name}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">${lang === 'uz' ? 'Telefon' : 'Телефон'}</span>
      <span class="summary-value">${phone}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">${lang === 'uz' ? 'Manzil' : 'Адрес'}</span>
      <span class="summary-value">${address}</span>
    </div>
    ${date ? `<div class="summary-row">
      <span class="summary-label">${lang === 'uz' ? 'Sana' : 'Дата'}</span>
      <span class="summary-value">${date} ${time}</span>
    </div>` : ''}
    ${msg ? `<div class="summary-row">
      <span class="summary-label">💌</span>
      <span class="summary-value" style="font-style:italic;color:#aaa">${msg}</span>
    </div>` : ''}
    <div class="divider"></div>
    <div class="summary-row summary-total">
      <span class="summary-label">${lang === 'uz' ? 'Jami' : 'Итого'}</span>
      <span class="summary-value">${pkg.price.toLocaleString()} so'm</span>
    </div>
  `;

  document.getElementById('amount-due').innerHTML =
    `${lang === 'uz' ? "To'lov miqdori" : 'Сумма к оплате'}: <strong>${pkg.price.toLocaleString()} so'm</strong>`;
}

// ── Copy card number ──────────────────────────────────────
function copyCard() {
  const card = document.getElementById('card-number').textContent;
  navigator.clipboard?.writeText(card.replace(/\s/g, '')).then(() => {
    showToast(lang === 'uz' ? '✅ Nusxa olindi!' : '✅ Скопировано!');
  });
}

// ── Place order ───────────────────────────────────────────
async function placeOrder() {
  const btn = document.getElementById('btn-order');
  btn.disabled = true;
  btn.textContent = lang === 'uz' ? 'Yuborilmoqda...' : 'Отправка...';

  const body = {
    telegramUserId: tgUser.id || 'unknown',
    telegramUsername: tgUser.username || '',
    packageId: selectedPkg.id,
    recipientName: document.getElementById('recipientName').value.trim(),
    recipientPhone: document.getElementById('recipientPhone').value.trim(),
    recipientAddress: document.getElementById('recipientAddress').value.trim(),
    deliveryDate: document.getElementById('deliveryDate').value,
    deliveryTime: document.getElementById('deliveryTime').value,
    message: document.getElementById('message').value.trim(),
    language: lang,
  };

  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    currentOrder = data;

    document.getElementById('final-order-id').innerHTML = `
      <div class="summary-row">
        <span class="summary-label">${lang === 'uz' ? 'Buyurtma ID' : 'ID заказа'}</span>
        <span class="summary-value" style="font-family:monospace">#${data.orderId.slice(0,8).toUpperCase()}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">${lang === 'uz' ? "To'lov" : 'Оплата'}</span>
        <span class="summary-value" style="color:var(--gold)">${data.formattedPrice}</span>
      </div>
    `;

    goToScreen(3);
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  } catch (e) {
    showToast('❌ Xatolik: ' + e.message);
    btn.disabled = false;
    btn.textContent = lang === 'uz' ? '✅ Buyurtma berish' : '✅ Оформить заказ';
  }
}

// ── Send receipt: notify server, then open admin chat ─────
async function openAdminForReceipt() {
  if (currentOrder) {
    try {
      await fetch(`/api/order/${currentOrder.orderId}/payment-sent`, { method: 'POST' });
    } catch(e) {}
  }
  tg?.close();
  window.open('https://t.me/YourAdminUsername', '_blank');
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Fetch card info from server ───────────────────────────
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const cfg = await res.json();
    document.getElementById('card-number').textContent = cfg.card || '8600 •••• •••• ••••';
    document.getElementById('card-holder').textContent = cfg.name || 'Admin';
  } catch(e) {}
}

// ── Tracking ──────────────────────────────────────────────
const STATUS_ORDER = ['pending_payment', 'payment_submitted', 'confirmed', 'delivering', 'delivered'];

function goToTracking() {
  if (!currentOrder) return;
  goToScreen(4);
  renderTrackingShell();
  startTracking();
}

function renderTrackingShell() {
  const pkg = selectedPkg || {};
  document.getElementById('trk-emoji').textContent = pkg.emoji || '🎁';
  document.getElementById('trk-pkg-name').textContent =
    lang === 'uz' ? (pkg.name_uz || '') : (pkg.name_ru || '');
  document.getElementById('trk-order-id').textContent =
    '#' + (currentOrder.orderId || '').slice(0, 8).toUpperCase();

  document.querySelectorAll('#screen-4 [data-uz]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });
}

async function startTracking() {
  if (trackingInterval) clearInterval(trackingInterval);
  await fetchAndRenderStatus();
  trackingInterval = setInterval(fetchAndRenderStatus, 5000);
}

async function fetchAndRenderStatus() {
  if (!currentOrder?.orderId) return;
  try {
    const res = await fetch(`/api/order/${currentOrder.orderId}`);
    const data = await res.json();
    if (data.success) renderTimeline(data.order);
  } catch (e) {}
}

function renderTimeline(order) {
  const currentIdx = STATUS_ORDER.indexOf(order.status);

  STATUS_ORDER.forEach((status, i) => {
    const dot = document.getElementById(`dot-${status}`);
    const line = document.getElementById(`line-${status}`);
    const title = document.getElementById(`title-${status}`);
    const sub = document.getElementById(`sub-${status}`);
    const timeEl = document.getElementById(`time-${status}`);
    if (!dot) return;

    dot.classList.remove('done', 'active', 'pending');
    if (title) title.classList.remove('done', 'active');
    if (line) line.classList.remove('done');

    if (i < currentIdx) {
      dot.classList.add('done');
      if (title) title.classList.add('done');
      if (line) line.classList.add('done');
      if (sub) sub.classList.add('show');
      dot.textContent = '✓';
    } else if (i === currentIdx) {
      dot.classList.add('active');
      if (title) title.classList.add('active');
      if (sub) sub.classList.add('show');
      const emojis = { pending_payment:'💳', payment_submitted:'📤', confirmed:'✅', delivering:'🚚', delivered:'🎉' };
      dot.textContent = emojis[status] || '●';
      if (timeEl && order.updatedAt) {
        timeEl.textContent = formatTime(order.updatedAt);
      }
    } else {
      dot.classList.add('pending');
    }
  });

  const card = document.getElementById('delivered-card');
  if (order.status === 'delivered') {
    card.classList.add('show');
    card.querySelector('h3').textContent = lang === 'uz' ? 'Yetkazildi!' : 'Доставлено!';
    card.querySelector('p').textContent = lang === 'uz'
      ? "Sovg'angiz sevgiliningizga muvaffaqiyatli topshirildi. Rahmat!"
      : 'Ваш подарок успешно доставлен любимой. Спасибо!';
    if (trackingInterval) { clearInterval(trackingInterval); trackingInterval = null; }
    document.getElementById('refresh-row').style.display = 'none';
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  } else {
    card.classList.remove('show');
  }
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

// ── Init ──────────────────────────────────────────────────
loadPackages();
loadConfig();
document.getElementById('deliveryDate').min = new Date().toISOString().split('T')[0];
