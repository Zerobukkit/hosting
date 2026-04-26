// main.js — entry point: welcome screen, routing, website mode
import { initGame } from './game.js';
import { Cart } from './cart.js';

// ─────────────────────────────────────────
//  SCREEN MANAGER
// ─────────────────────────────────────────
const screens = {
  welcome: document.getElementById('welcome-screen'),
  game:    document.getElementById('game-screen'),
  website: document.getElementById('website-screen'),
};

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.style.display = key === name ? 'flex' : 'none';
  });
}

// ─────────────────────────────────────────
//  SAKURA PETAL CANVAS
// ─────────────────────────────────────────
function initPetals() {
  const canvas = document.getElementById('petal-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, petals;

  const COLORS = ['#f8b8d8', '#f090c0', '#fce0f0', '#e870b0', '#fdd0e8'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    petals = Array.from({ length: 60 }, () => makePetal());
  }

  function makePetal(fromTop = false) {
    return {
      x:    Math.random() * W,
      y:    fromTop ? -10 : Math.random() * H,
      r:    Math.random() * 5 + 3,
      vx:   (Math.random() - 0.5) * 1.2,
      vy:   Math.random() * 1.2 + 0.5,
      rot:  Math.random() * Math.PI * 2,
      rspd: (Math.random() - 0.5) * 0.06,
      col:  COLORS[Math.floor(Math.random() * COLORS.length)],
      sway: Math.random() * Math.PI * 2,
      swaySpd: Math.random() * 0.02 + 0.008,
    };
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.beginPath();
    // Simple oval petal shape
    ctx.ellipse(0, 0, p.r, p.r * 1.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = p.col;
    ctx.globalAlpha = 0.75;
    ctx.fill();
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    petals.forEach(p => {
      p.sway += p.swaySpd;
      p.x   += p.vx + Math.sin(p.sway) * 0.6;
      p.y   += p.vy;
      p.rot += p.rspd;
      if (p.y > H + 10) Object.assign(p, makePetal(true), { x: Math.random() * W });
      if (p.x < -10)    p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      drawPetal(p);
    });
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  tick();
}

// ─────────────────────────────────────────
//  WELCOME MENU NAVIGATION
// ─────────────────────────────────────────
function initWelcome() {
  const items    = Array.from(document.querySelectorAll('.menu-item'));
  let activeIdx  = 0;
  let gameInited = false;

  function setActive(idx) {
    activeIdx = (idx + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
  }

  function select() {
    const action = items[activeIdx].dataset.action;
    if (action === 'game') {
      showScreen('game');
      if (!gameInited) { initGame(); gameInited = true; }
    } else if (action === 'shop') {
      showScreen('website');
      openWebTab('shop');
    } else if (action === 'about') {
      showScreen('website');
      openWebTab('about');
    }
  }

  // Keyboard navigation (only when welcome is visible)
  window.addEventListener('keydown', e => {
    if (screens.welcome.style.display === 'none') return;
    if (e.key === 'ArrowUp'   || e.key === 'w') { e.preventDefault(); setActive(activeIdx - 1); }
    if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); setActive(activeIdx + 1); }
    if (e.key === 'Enter'     || e.key === ' ') { e.preventDefault(); select(); }
  });

  items.forEach((el, i) => {
    el.addEventListener('mouseenter', () => setActive(i));
    el.addEventListener('click', () => { setActive(i); select(); });
  });

  setActive(0);
}

// ─────────────────────────────────────────
//  BACK BUTTONS
// ─────────────────────────────────────────
document.getElementById('hud-back-btn').addEventListener('click', () => showScreen('welcome'));
document.getElementById('web-back-btn').addEventListener('click', () => showScreen('welcome'));

// ─────────────────────────────────────────
//  WEBSITE TAB SYSTEM
// ─────────────────────────────────────────
function openWebTab(tabName) {
  document.querySelectorAll('.web-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('.web-content').forEach(c => {
    c.classList.toggle('active', c.id === `tab-${tabName}`);
  });
  if (tabName === 'cart') renderWebCart();
  if (tabName === 'shop') renderWebShop();
}

document.querySelectorAll('.web-tab[data-tab]').forEach(tab => {
  tab.addEventListener('click', () => openWebTab(tab.dataset.tab));
});

// Cart icon (top-right) opens the cart tab
document.getElementById('web-cart-icon-btn').addEventListener('click', () => openWebTab('cart'));

// ── Website Shop ──
let webSelectedItem = null;
let webSelectedSize = null;
let webQty = 1;
let shopRendered = false;

const WEB_ITEMS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  name: `Item ${i + 1}`,
  img: `https://picsum.photos/seed/shopitem${i + 1}/520/520`,
  desc: 'A fine piece of adventuring gear. Crafted with care and premium materials. Perfect for any occasion.',
}));

function renderWebShop() {
  if (shopRendered) return;
  shopRendered = true;

  const grid       = document.getElementById('shop-items-grid');
  const previewImg = document.getElementById('web-preview-img');
  const previewEmpty = document.getElementById('web-preview-empty');
  const emptyMsg   = document.getElementById('web-detail-empty-msg');
  const content    = document.getElementById('web-detail-content');
  const nameEl     = document.getElementById('web-detail-name');
  const descEl     = document.getElementById('web-detail-desc');

  WEB_ITEMS.forEach(item => {
    const card = document.createElement('div');
    card.className = 'web-shop-item';
    card.innerHTML = `
      <img class="web-item-thumb" src="${item.img}" alt="${item.name}" />
      <div class="web-item-num">I${item.id + 1}</div>`;
    card.onclick = () => {
      grid.querySelectorAll('.web-shop-item').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      webSelectedItem = item;

      // Centre preview
      previewImg.src = item.img;
      previewImg.style.display = 'block';
      previewEmpty.style.display = 'none';

      // Right detail panel
      nameEl.textContent = item.name;
      descEl.textContent = item.desc;
      emptyMsg.style.display = 'none';
      content.style.display  = 'flex';
    };
    grid.appendChild(card);
  });

  // Size buttons
  document.querySelectorAll('#size-buttons .size-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#size-buttons .size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      webSelectedSize = btn.dataset.size;
    };
  });

  // Qty
  const qtyEl = document.getElementById('web-qty-value');
  document.getElementById('web-qty-minus').onclick = () => {
    webQty = Math.max(1, webQty - 1);
    qtyEl.textContent = webQty;
  };
  document.getElementById('web-qty-plus').onclick = () => {
    webQty++;
    qtyEl.textContent = webQty;
  };

  // Add to cart
  document.getElementById('web-add-cart-btn').onclick = () => {
    if (!webSelectedItem) { flashAddBtn('Select an item first!'); return; }
    if (!webSelectedSize) { flashAddBtn('Select a size first!');  return; }
    Cart.add({ name: webSelectedItem.name, size: webSelectedSize, qty: webQty });
    flashAddBtn(`✓ Added ${webQty}× ${webSelectedItem.name} (${webSelectedSize})`);
    updateCartCount();
  };
}

function updateCartCount() {
  const el = document.getElementById('web-cart-count');
  if (!el) return;
  const total = Cart.get().reduce((s, i) => s + i.qty, 0);
  el.textContent = total;
}

function flashAddBtn(msg) {
  const btn = document.getElementById('web-add-cart-btn');
  const orig = btn.textContent;
  btn.textContent = msg;
  btn.style.background = 'rgba(240,144,184,0.3)';
  setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 1800);
}

// ── Website Cart ──
function renderWebCart() {
  updateCartCount();
  const container = document.getElementById('cart-content');
  container.innerHTML = '';
  const items = Cart.get();

  if (items.length === 0) {
    container.innerHTML = '<div class="web-cart-empty">Your cart is empty…</div>';
    return;
  }

  items.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'web-cart-item';
    row.innerHTML = `
      <div class="web-cart-info"><strong>${item.name}</strong> — Size ${item.size}</div>
      <div class="web-cart-qty">
        <button class="cart-qty-btn" data-op="minus">−</button>
        <span class="cart-qty-val">${item.qty}</span>
        <button class="cart-qty-btn" data-op="plus">+</button>
      </div>
      <button class="cart-remove-btn" title="Remove">🗑</button>`;

    const qtyVal = row.querySelector('.cart-qty-val');
    row.querySelector('[data-op="minus"]').onclick = () => {
      const c = Cart.get();
      if (c[idx] && c[idx].qty > 1) {
        c[idx].qty--; Cart.save(c);
        qtyVal.textContent = c[idx].qty;
        updateWebSummary(container);
      }
    };
    row.querySelector('[data-op="plus"]').onclick = () => {
      const c = Cart.get();
      if (c[idx]) { c[idx].qty++; Cart.save(c); qtyVal.textContent = c[idx].qty; updateWebSummary(container); }
    };
    row.querySelector('.cart-remove-btn').onclick = () => {
      Cart.save(Cart.get().filter((_, i) => i !== idx));
      renderWebCart();
    };
    container.appendChild(row);
  });

  const summary = document.createElement('div');
  summary.className = 'web-cart-summary';
  summary.id = 'web-cart-summary';
  container.appendChild(summary);
  updateWebSummary(container);
}

function updateWebSummary(container) {
  const total = Cart.get().reduce((s, i) => s + i.qty, 0);
  const el = container.querySelector('#web-cart-summary');
  if (el) el.textContent = `Total items: ${total}`;
}

// ─────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────
initPetals();
initWelcome();
updateCartCount();
showScreen('welcome');
