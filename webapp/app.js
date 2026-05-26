// ── Telegram init ──────────────────────────────────────────
const tg = window.Telegram?.WebApp;
if (tg) { tg.expand(); tg.setHeaderColor('#000000'); tg.setBackgroundColor('#000000'); }

// ── Box catalog data ───────────────────────────────────────
const BOXES = [
  {
    id: 'elegant',
    name: 'Elegant',
    badge: 'KLASSIK',
    tagline: "Nozik va nafis — sof sevgining ifodasi",
    price: 199000,
    gradient: 'linear-gradient(160deg, #2a0a0a 0%, #4a1a1a 60%, #1a0505 100%)',
    coverImg: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=800&q=80',
    items: [
      {
        name: "Gul",
        desc: "Qizil atirgullar buket — 11 ta",
        img: 'https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#3d1010,#1a0505)'
      },
      {
        name: "O'yinchoq",
        desc: "Yumshoq plyusheviy o'yinchoq",
        img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#1a1a1a,#0a0a0a)'
      }
    ]
  },
  {
    id: 'afradita',
    name: 'Afradita',
    badge: 'ROMANTIK',
    tagline: "Ishq va muhabbat ramzi — ilohiy hadya",
    price: 299000,
    gradient: 'linear-gradient(160deg, #1a0a18 0%, #3a1030 60%, #0d0508 100%)',
    coverImg: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80',
    items: [
      {
        name: "Gul",
        desc: "Qizil atirgullar buket — 15 ta",
        img: 'https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#3d1010,#1a0505)'
      },
      {
        name: "Shkolad",
        desc: "Belgiya premium shokoladi, 200g",
        img: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#1a0e05,#0a0800)'
      },
      {
        name: "Kichik o'yinchoq",
        desc: "Miniatür plyusheviy hayvon",
        img: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#1a1015,#0a050d)'
      }
    ]
  },
  {
    id: 'soliha',
    name: 'Soliha',
    badge: 'NAFIS',
    tagline: "Ma'rifatli va ziyoli ayollar uchun",
    price: 249000,
    gradient: 'linear-gradient(160deg, #080a16 0%, #121828 60%, #060810 100%)',
    coverImg: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    items: [
      {
        name: "Shkolad",
        desc: "Premium shokolad to'plami",
        img: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#1a0e05,#0a0800)'
      },
      {
        name: "Tasbeh",
        desc: "Nafis kristal marjonlar",
        img: 'https://images.unsplash.com/photo-1533630757602-43df9a3e45c7?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#0a0a1e,#05050f)'
      },
      {
        name: "Suviner",
        desc: "Esdalik bezak buyumi",
        img: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#1a1510,#0a0908)'
      },
      {
        name: "Blaknot",
        desc: "Charm qoplamali elegant daftar",
        img: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#181818,#080808)'
      }
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    badge: 'PREMIUM',
    tagline: "Eng yaxshisi — faqat maxsus insonlar uchun",
    price: 499000,
    gradient: 'linear-gradient(160deg, #0d0d00 0%, #1c1a00 60%, #0a0800 100%)',
    coverImg: 'https://images.unsplash.com/photo-1518481852452-9415b262eba4?auto=format&fit=crop&w=800&q=80',
    items: [
      {
        name: "Gul",
        desc: "Qizil atirgullar buket — 21 ta",
        img: 'https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#3d1010,#1a0505)'
      },
      {
        name: "Klubnika",
        desc: "Shokoladli qulupnay, 300g",
        img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#3d0a0a,#1a0505)'
      },
      {
        name: "Shkolad",
        desc: "Belgiya premium shokolad koleksiyasi",
        img: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#1a0e05,#0a0800)'
      },
      {
        name: "Ayiq",
        desc: "Katta plyusheviy ayiq (50 sm)",
        img: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=300&q=80',
        gradient: 'linear-gradient(135deg,#1a1208,#0a0805)'
      }
    ]
  },
  {
    id: 'cs1',
    name: 'Mystika',
    comingSoon: true,
    gradient: 'linear-gradient(160deg,#080808,#141414)'
  },
  {
    id: 'cs2',
    name: 'Luxe',
    comingSoon: true,
    gradient: 'linear-gradient(160deg,#0a0a06,#161610)'
  }
];

// ── State ───────────────────────────────────────────────────
let activeBox = null;
let cart = [];

// ── Helpers ─────────────────────────────────────────────────
function fmt(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

function loadImg(el, url, gradient) {
  el.style.background = gradient;
  if (!url) return;
  const img = new Image();
  img.onload = () => {
    el.style.backgroundImage = `url('${url}')`;
    el.classList.add('loaded');
  };
  img.src = url;
}

// ── Render catalog ──────────────────────────────────────────
function renderCatalog() {
  const grid = document.getElementById('boxes-grid');
  grid.innerHTML = BOXES.map(box => {
    if (box.comingSoon) {
      return `
        <div class="box-card coming-soon">
          <div class="box-card-image" style="background:${box.gradient}"></div>
          <div class="cs-overlay">
            <span class="cs-label">TEZDA</span>
            <span class="cs-name">${box.name}</span>
          </div>
        </div>`;
    }
    return `
      <div class="box-card" onclick="openModal('${box.id}')" data-id="${box.id}">
        <div class="box-card-image" style="background:${box.gradient}" data-img="${box.coverImg}"></div>
        <div class="box-card-gradient"></div>
        <div class="box-card-content">
          <div class="box-card-badge">${box.badge}</div>
          <div class="box-card-name">${box.name}</div>
          <div class="box-card-price">${fmt(box.price)}</div>
        </div>
      </div>`;
  }).join('');

  // Lazy-load card cover images
  grid.querySelectorAll('.box-card-image[data-img]').forEach(el => {
    loadImg(el, el.dataset.img, el.style.background);
  });
}

// ── Open box detail modal ───────────────────────────────────
function openModal(id) {
  activeBox = BOXES.find(b => b.id === id);
  if (!activeBox) return;

  // Hero image
  const heroEl = document.getElementById('modal-hero-img');
  loadImg(heroEl, activeBox.coverImg, activeBox.gradient);

  // Text
  document.getElementById('modal-badge').textContent   = activeBox.badge;
  document.getElementById('modal-name').textContent    = activeBox.name;
  document.getElementById('modal-tagline-txt').textContent = activeBox.tagline;
  document.getElementById('modal-price').innerHTML = `
    <span class="price-label">Narxi</span>
    <span class="price-value">${fmt(activeBox.price)}</span>`;

  // Items list
  document.getElementById('modal-items').innerHTML = activeBox.items.map((item, i) => `
    <div class="item-row">
      <div class="item-img" id="iimg-${i}" style="background:${item.gradient}"></div>
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
      </div>
    </div>`).join('');

  // Lazy-load item images
  activeBox.items.forEach((item, i) => {
    const el = document.getElementById(`iimg-${i}`);
    if (el) loadImg(el, item.img, item.gradient);
  });

  // Reset scroll
  document.querySelector('.modal-scroll').scrollTop = 0;

  // Show
  document.getElementById('box-modal-overlay').classList.add('active');
  document.getElementById('box-modal').classList.add('open');
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function closeBoxModal() {
  document.getElementById('box-modal-overlay').classList.remove('active');
  document.getElementById('box-modal').classList.remove('open');
}

// ── Add to cart with drop animation ────────────────────────
function addToCart() {
  if (!activeBox) return;
  const box = activeBox;

  // Capture positions BEFORE closing modal
  const heroEl  = document.getElementById('modal-hero-img');
  const cartWrap = document.getElementById('cart-icon-wrap');
  const cartBar  = document.getElementById('cart-bar');
  const heroRect = heroEl.getBoundingClientRect();

  // Create flying element at hero center
  const size  = 72;
  const flying = document.createElement('div');
  flying.className = 'flying-item';
  flying.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${heroRect.left + heroRect.width  / 2 - size / 2}px;
    top:  ${heroRect.top  + heroRect.height / 2 - size / 2}px;
    background: ${box.gradient};
    background-image: url('${box.coverImg}');
    opacity: 1;
  `;
  document.body.appendChild(flying);

  // Close modal first so cart bar is accessible
  closeBoxModal();

  // Show cart bar now (needed to read its rect)
  cartBar.classList.add('visible');

  // Start fly animation on next paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const cartRect = cartWrap.getBoundingClientRect();
      const endSize  = 18;
      flying.style.transition =
        'left 0.52s cubic-bezier(0.25,0.46,0.45,0.94),' +
        'top 0.52s cubic-bezier(0.25,0.46,0.45,0.94),' +
        'width 0.52s ease, height 0.52s ease,' +
        'opacity 0.35s ease 0.25s';
      flying.style.left    = `${cartRect.left + cartRect.width  / 2 - endSize / 2}px`;
      flying.style.top     = `${cartRect.top  + cartRect.height / 2 - endSize / 2}px`;
      flying.style.width   = `${endSize}px`;
      flying.style.height  = `${endSize}px`;
      flying.style.opacity = '0';
    });
  });

  // Commit cart update after animation lands
  setTimeout(() => {
    flying.remove();

    const existing = cart.find(c => c.id === box.id);
    if (existing) existing.qty++;
    else cart.push({ id: box.id, name: box.name, price: box.price, coverImg: box.coverImg, gradient: box.gradient, qty: 1 });

    updateCartUI();
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    showToast("Korzinaga qo'shildi");
  }, 560);
}

function updateCartUI() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const countEl   = document.getElementById('cart-count');
  const cartWrap  = document.getElementById('cart-icon-wrap');

  countEl.textContent = count;
  document.getElementById('cart-items-label').textContent = `${count} ta mahsulot`;
  document.getElementById('cart-total').textContent = fmt(total);

  // Bounce animations
  cartWrap.classList.remove('cart-bounce');
  void cartWrap.offsetWidth;
  cartWrap.classList.add('cart-bounce');

  countEl.classList.remove('count-pop');
  void countEl.offsetWidth;
  countEl.classList.add('count-pop');
}

// ── Checkout ────────────────────────────────────────────────
function openCheckout() {
  if (!cart.length) return;

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const names = cart.map(c => c.qty > 1 ? `${c.name} ×${c.qty}` : c.name).join(', ');
  const first = cart[0];

  const sumEl = document.getElementById('checkout-summary');
  sumEl.innerHTML = `
    <div class="cs-img" id="cs-thumb" style="background:${first.gradient}"></div>
    <div>
      <div class="cs-info-name">${names}</div>
      <div class="cs-info-price">${fmt(total)}</div>
    </div>`;

  const thumb = document.getElementById('cs-thumb');
  if (first.coverImg) loadImg(thumb, first.coverImg, first.gradient);

  document.getElementById('checkout-overlay').classList.add('active');
  document.getElementById('checkout-modal').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkout-overlay').classList.remove('active');
  document.getElementById('checkout-modal').classList.remove('open');
}

// ── Place order ─────────────────────────────────────────────
async function placeOrder() {
  const recipientName    = document.getElementById('recipientName').value.trim();
  const recipientPhone   = document.getElementById('recipientPhone').value.trim();
  const recipientAddress = document.getElementById('recipientAddress').value.trim();

  if (!recipientName || !recipientPhone || !recipientAddress) {
    showToast("Iltimos, barcha maydonlarni to'ldiring");
    return;
  }

  const btn = document.getElementById('btn-place-order');
  btn.textContent = 'Yuborilmoqda...';
  btn.disabled = true;

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const payload = {
    telegramUserId:    tg?.initDataUnsafe?.user?.id || 'unknown',
    telegramUsername:  tg?.initDataUnsafe?.user?.username || '',
    senderName:        document.getElementById('senderName').value.trim(),
    recipientName,
    recipientPhone,
    recipientAddress,
    deliveryDate:      document.getElementById('deliveryDate').value,
    message:           document.getElementById('message').value.trim(),
    items:             cart.map(c => ({ id: c.id, name: c.name, price: c.price, qty: c.qty })),
    totalPrice:        total,
  };

  let orderId = genId();
  try {
    const res  = await fetch('/api/order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.orderId) orderId = data.orderId;
  } catch (_) { /* show success anyway — offline resilience */ }

  // Save to localStorage for status tracking
  pendingOrderId = orderId;
  savedOrder = { orderId };
  localStorage.setItem('noirbox_order', JSON.stringify({ orderId }));

  closeCheckout();
  document.getElementById('success-order-id').textContent = `#${orderId.slice(0,8).toUpperCase()}`;
  document.getElementById('success-overlay').classList.add('active');
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

  // Show order banner
  showOrderBanner();
  document.getElementById('ob-status-txt').textContent = STATUS_LABELS['pending_payment'];
  document.getElementById('ob-dot').className = 'ob-dot pending';

  cart = [];
  btn.textContent = 'Buyurtma berish';
  btn.disabled = false;
}

function closeSuccess() {
  document.getElementById('success-overlay').classList.remove('active');
  document.getElementById('cart-bar').classList.remove('visible');
  document.getElementById('cart-count').textContent = '0';
  document.getElementById('cart-items-label').textContent = '0 ta mahsulot';
  document.getElementById('cart-total').textContent = "0 so'm";
  ['senderName','recipientName','recipientPhone','recipientAddress','deliveryDate','message']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  // Kick off status polling now the user dismissed success
  fetchAndRenderStatus();
}

function genId() {
  return Math.random().toString(36).slice(2, 12);
}

// ── Order status tracking ───────────────────────────────────
const STATUS_STEPS = [
  { key: 'pending_payment',   label: "Buyurtma qabul qilindi", icon: '📋' },
  { key: 'payment_submitted', label: "Chek yuborildi",          icon: '📤' },
  { key: 'confirmed',         label: "Tasdiqlandi",             icon: '✅' },
  { key: 'delivering',        label: "Yo'lda",                  icon: '🚚' },
  { key: 'delivered',         label: "Yetkazildi",              icon: '🎉' },
];

const STATUS_LABELS = {
  pending_payment:   "To'lov kutilmoqda",
  payment_submitted: "Chek yuborildi — tekshirilmoqda",
  confirmed:         "Tasdiqlandi — tayyorlanmoqda",
  delivering:        "Yo'lda!",
  delivered:         "Yetkazildi!",
};

let savedOrder    = null;
let trackInterval = null;
let pendingOrderId = null; // set right after placing order, before API confirms

function checkSavedOrder() {
  try {
    const raw = localStorage.getItem('noirbox_order');
    if (!raw) return;
    savedOrder = JSON.parse(raw);
    if (savedOrder?.orderId) {
      showOrderBanner();
      fetchAndRenderStatus();
    }
  } catch (_) { localStorage.removeItem('noirbox_order'); }
}

function showOrderBanner() {
  const el = document.getElementById('order-banner');
  el.classList.add('show');
  document.getElementById('ob-id').textContent = '#' + savedOrder.orderId.slice(0, 8).toUpperCase();
}

async function fetchAndRenderStatus() {
  if (!savedOrder?.orderId) return;
  try {
    const res  = await fetch(`/api/order/${savedOrder.orderId}`);
    const data = await res.json();
    if (!data.success) return;

    const order = data.order;
    savedOrder.order = order;

    // Update banner
    document.getElementById('ob-status-txt').textContent = STATUS_LABELS[order.status] || order.status;
    const dot = document.getElementById('ob-dot');
    dot.className = 'ob-dot';
    if      (order.status === 'delivered')        dot.classList.add('done');
    else if (order.status === 'pending_payment')  dot.classList.add('pending');
    else                                          dot.classList.add('processing');

    // Update status modal if open
    if (document.getElementById('status-modal').classList.contains('open')) {
      renderStatusContent(order);
    }

    // Stop polling once delivered
    if (order.status === 'delivered') {
      if (trackInterval) { clearInterval(trackInterval); trackInterval = null; }
      localStorage.removeItem('noirbox_order');
    }
  } catch (_) {}
}

function openStatusModal() {
  document.getElementById('status-overlay').classList.add('active');
  document.getElementById('status-modal').classList.add('open');

  if (savedOrder?.order) {
    renderStatusContent(savedOrder.order);
  } else {
    document.getElementById('status-meta').innerHTML =
      '<p style="color:var(--neutral);font-size:13px;padding:8px 0">Yuklanmoqda...</p>';
    document.getElementById('timeline').innerHTML = '';
    fetchAndRenderStatus();
  }

  if (!trackInterval) {
    trackInterval = setInterval(fetchAndRenderStatus, 5000);
  }
}

function closeStatusModal() {
  document.getElementById('status-overlay').classList.remove('active');
  document.getElementById('status-modal').classList.remove('open');
  if (trackInterval) { clearInterval(trackInterval); trackInterval = null; }
}

function renderStatusContent(order) {
  // Meta card
  const dateStr = order.deliveryDate
    ? `<div class="smeta-row"><span class="smeta-label">Yetkazish sanasi</span><span class="smeta-value">${order.deliveryDate}</span></div>`
    : '';
  document.getElementById('status-meta').innerHTML = `
    <div class="smeta-row">
      <span class="smeta-label">ID</span>
      <span class="smeta-value" style="font-family:monospace">#${order.id.slice(0,8).toUpperCase()}</span>
    </div>
    <div class="smeta-row">
      <span class="smeta-label">Quti</span>
      <span class="smeta-value">${order.packageName}</span>
    </div>
    <div class="smeta-row">
      <span class="smeta-label">Summa</span>
      <span class="smeta-value">${fmt(order.price)}</span>
    </div>
    <div class="smeta-row">
      <span class="smeta-label">Qabul qiluvchi</span>
      <span class="smeta-value">${order.recipientName} · ${order.recipientPhone}</span>
    </div>
    ${dateStr}`;

  // Timeline
  const curIdx = STATUS_STEPS.findIndex(s => s.key === order.status);
  document.getElementById('timeline').innerHTML = STATUS_STEPS.map((step, i) => {
    const done   = i < curIdx;
    const active = i === curIdx;
    const last   = i === STATUS_STEPS.length - 1;
    return `
      <div class="tl-step">
        <div class="tl-left">
          <div class="tl-dot ${done ? 'done' : active ? 'active' : ''}">${done ? '✓' : step.icon}</div>
          ${!last ? `<div class="tl-line ${done ? 'done' : ''}"></div>` : ''}
        </div>
        <div class="tl-content">
          <div class="tl-title ${done ? 'done' : active ? 'active' : ''}">${step.label}</div>
          ${active && order.updatedAt ? `<div class="tl-time">${fmtTime(order.updatedAt)}</div>` : ''}
        </div>
      </div>`;
  }).join('');

  // Footer button
  const footer = document.getElementById('status-footer');
  if (order.status === 'pending_payment') {
    footer.style.display = 'flex';
    footer.innerHTML = `<button class="btn-red full-width" onclick="sendReceipt()">To'lov chekini yuborish 📸</button>`;
  } else {
    footer.style.display = 'none';
  }
}

function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return ''; }
}

// ── Send receipt (payment-sent) ─────────────────────────────
async function sendReceipt() {
  const orderId = savedOrder?.orderId || pendingOrderId;
  if (!orderId) return;

  const btn = document.getElementById('btn-send-receipt') ||
              document.querySelector('#status-footer .btn-red');
  if (btn) { btn.textContent = 'Yuborilmoqda...'; btn.disabled = true; }

  try {
    await fetch(`/api/order/${orderId}/payment-sent`, { method: 'POST' });
    if (savedOrder) { savedOrder.order = null; } // force re-fetch
    fetchAndRenderStatus();

    showToast("Telegram botga to'lov rasmini yuboring 📸");

    // If inside Telegram WebApp — close it so user can message the bot
    if (tg?.close) {
      setTimeout(() => tg.close(), 1200);
    } else {
      // Web browser fallback: just update UI
      closeSuccess();
      openStatusModal();
    }
  } catch (_) {
    showToast("Xatolik yuz berdi, qayta urinib ko'ring");
    if (btn) { btn.textContent = "To'lov chekini yuborish 📸"; btn.disabled = false; }
  }
}

// ── Init ────────────────────────────────────────────────────
document.getElementById('deliveryDate').min = new Date().toISOString().split('T')[0];
renderCatalog();
checkSavedOrder();
