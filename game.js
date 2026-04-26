// game.js — main game logic (fixed & redesigned)
import { Player } from './player.js';
import { setupSquares, isNearSquare, getNearestSquare } from './utils.js';
import { Cart } from './cart.js';

export function initGame() {
  const playerEl = document.getElementById('player');
  const popup    = document.getElementById('popup');
  const squares  = setupSquares();
  const player   = new Player(playerEl);

  const keys = { w:false, a:false, s:false, d:false,
                 ArrowUp:false, ArrowLeft:false, ArrowDown:false, ArrowRight:false };
  let popupOpen     = false;
  let dialogueActive = false;

  // ─────────────────────────────────────────
  //  DIALOGUE — DOM refs (built in HTML)
  // ─────────────────────────────────────────
  const dialogueOverlay = document.getElementById('dialogue-overlay');
  const dialogueBox     = document.getElementById('dialogue-inner');
  const dialogueText    = document.getElementById('dialogue-text');
  const dialogueBtns    = document.getElementById('dialogue-buttons');
  const dialogueImg     = document.getElementById('dialogue-npc-img');
  const dialogueName    = document.getElementById('dialogue-npc-name');
  const proximityTip    = document.getElementById('proximity-tip');

  // ─────────────────────────────────────────
  //  TYPEWRITER
  // ─────────────────────────────────────────
  let typeTimer       = null;
  let typingActive    = false;
  let skipHandler     = null;   // single reference, properly cleaned up

  function clearTypewriter() {
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
    typingActive = false;
    if (skipHandler) {
      dialogueBox.removeEventListener('click', skipHandler);
      skipHandler = null;
    }
  }

  function typeText(text, onDone) {
    clearTypewriter();
    dialogueText.textContent = '';
    let i = 0;
    typingActive = true;

    // Click anywhere on the box to skip to end
    skipHandler = () => {
      if (!typingActive) return;
      clearTypewriter();
      dialogueText.textContent = text;
      if (onDone) onDone();
    };
    dialogueBox.addEventListener('click', skipHandler);

    typeTimer = setInterval(() => {
      dialogueText.textContent += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearTypewriter();
        if (onDone) onDone();
      }
    }, 32);
  }

  // ─────────────────────────────────────────
  //  DIALOGUE OPEN / CLOSE
  // ─────────────────────────────────────────
  const NPC_DATA = {
    'shop-npc':  ['Welcome, traveler! Take a look at my wares!', 'Would you like to browse the shop?',   'Shopkeeper', 'uploads/ShopNPC.png'],
    'about-npc': ['Ah, curious about who we are? Smart!',        'Shall I tell you about our brand?',    'Brand Rep',  'uploads/AboutNPC.png'],
    'cart-npc':  ['I have been guarding your cart carefully!',   'Want to check what is in your cart?',  'Cart Guard', 'uploads/CartNPC.png'],
    'faq-npc':   ['Got questions? I have all the answers!',      'Want to see the FAQ?',                  'Support',    'uploads/FAQNPC.png'],
  };

  function openDialogue(squareId) {
    const [greeting, question, npcLabel, npcSrc] = NPC_DATA[squareId];

    dialogueImg.src         = npcSrc;
    dialogueName.textContent = npcLabel;
    dialogueBtns.innerHTML  = '';
    dialogueOverlay.classList.add('show');
    dialogueActive = true;
    popupOpen      = true;
    proximityTip.classList.remove('visible');

    typeText(greeting, () => renderButtons('first', squareId, question));
  }

  function renderButtons(stage, squareId, question) {
    dialogueBtns.innerHTML = '';

    if (stage === 'first') {
      dialogueBtns.append(
        makeBtn('NEXT', 'dlg-btn-next', () => {
          typeText(question, () => renderButtons('second', squareId, question));
        }),
        makeBtn('END CHAT', 'dlg-btn-end', closeDialogue)
      );
    } else if (stage === 'second') {
      dialogueBtns.append(
        makeBtn('YES', 'dlg-btn-yes', () => { closeDialogue(); openPopup(squareId); }),
        makeBtn('NO',  'dlg-btn-no',  closeDialogue)
      );
    }
  }

  function makeBtn(label, cls, onClick) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className   = 'dlg-btn ' + cls;
    btn.onclick     = onClick;
    return btn;
  }

  function closeDialogue() {
    clearTypewriter();
    dialogueOverlay.classList.remove('show');
    dialogueActive = false;
    popupOpen      = false;
  }

  // ─────────────────────────────────────────
  //  POPUP
  // ─────────────────────────────────────────
  const NPC_META = {
    'shop-npc':  { title: 'Shop Items', icon: 'uploads/ShopNPC.png'  },
    'about-npc': { title: 'Our Brand',  icon: 'uploads/AboutNPC.png' },
    'cart-npc':  { title: 'Your Cart',  icon: 'uploads/CartNPC.png'  },
    'faq-npc':   { title: 'FAQ',        icon: 'uploads/FAQNPC.png'   },
  };

  function openPopup(squareId) {
    const npc = NPC_META[squareId];
    popup.innerHTML = '';
    popup.className = '';

    // Header
    const header = document.createElement('div');
    header.className = 'popup-header';
    header.innerHTML = `
      <div class="popup-header-left">
        <div class="popup-npc-frame"><img src="${npc.icon}" alt="NPC"></div>
        <div class="popup-header-title">${npc.title}</div>
      </div>
      <div class="popup-header-right">
        ${squareId === 'shop-npc'
          ? `<button class="popup-cart-btn" id="popup-cart-btn">🛍 CART</button>`
          : ''}
        <button class="popup-exit-btn" id="popup-exit-btn">✕ EXIT</button>
      </div>`;
    popup.appendChild(header);

    const body = document.createElement('div');
    body.className = 'popup-body';

    if      (squareId === 'shop-npc')  buildShopBody(body);
    else if (squareId === 'cart-npc')  buildCartBody(body);
    else                                buildGenericBody(body, squareId);

    popup.appendChild(body);

    // Show popup
    popup.style.display = 'flex';
    requestAnimationFrame(() => popup.classList.add('show'));
    popupOpen = true;

    // Wire exit
    document.getElementById('popup-exit-btn').onclick = closePopup;

    // Wire cart shortcut (shop popup only)
    const cartBtn = document.getElementById('popup-cart-btn');
    if (cartBtn) {
      cartBtn.onclick = () => {
        popup.classList.remove('show');
        setTimeout(() => { popup.innerHTML = ''; openPopup('cart-npc'); }, 220);
      };
    }
  }

  function closePopup() {
    popup.classList.remove('show');
    setTimeout(() => {
      popup.style.display = 'none';
      popup.innerHTML     = '';
      popupOpen = false;
    }, 220);
  }

  // ── Shop body — left image, right (items / info / controls) ──
  function buildShopBody(body) {
    const ITEMS = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `Item ${i + 1}`,
      img: `https://picsum.photos/seed/shopitem${i+1}/520/520`,
      desc: `A fine piece of adventuring gear. Crafted with care and premium materials. Perfect for any occasion.`
    }));

    let selectedItem = null;
    let selectedSize = null;
    let qty = 1;

    const layout = document.createElement('div');
    layout.className = 'shop-split';

    // ── LEFT: full-height item image ──
    const left = document.createElement('div');
    left.className = 'shop-img-pane';
    left.innerHTML = `
      <div class="sq-img-wrap" id="sq-img-wrap">
        <div class="sq-no-item">No item selected</div>
      </div>`;

    // ── RIGHT: 3 stacked sections ──
    const right = document.createElement('div');
    right.className = 'shop-right-stack';

    // Items
    const itemsSec = document.createElement('div');
    itemsSec.className = 'shop-sec shop-sec-items';
    itemsSec.innerHTML = `<div class="sq-label">ITEMS</div>`;
    const itemList = document.createElement('div');
    itemList.className = 'shop-item-list';
    ITEMS.forEach(item => {
      const row = document.createElement('div');
      row.className = 'shop-item';
      row.innerHTML = `
        <div class="shop-item-img">I${item.id + 1}</div>
        <span class="shop-item-name">${item.name}</span>`;
      row.onclick = () => {
        itemList.querySelectorAll('.shop-item').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        selectedItem = item;

        const wrap = document.getElementById('sq-img-wrap');
        wrap.innerHTML = `<img class="sq-item-img" src="${item.img}" alt="${item.name}" />`;

        document.getElementById('sq-desc-name').textContent = item.name;
        document.getElementById('sq-desc-text').textContent = item.desc;
      };
      itemList.appendChild(row);
    });
    itemsSec.appendChild(itemList);

    // Info
    const infoSec = document.createElement('div');
    infoSec.className = 'shop-sec shop-sec-info';
    infoSec.innerHTML = `
      <div class="sq-label">ITEM INFO</div>
      <div class="sq-desc-name" id="sq-desc-name">—</div>
      <div class="sq-desc-text" id="sq-desc-text">Select an item from the list to see details.</div>`;

    // Controls
    const ctrlSec = document.createElement('div');
    ctrlSec.className = 'shop-sec shop-sec-controls';
    ctrlSec.innerHTML = `
      <div class="sq-label">ADD TO CART</div>
      <div class="sq-controls">
        <div>
          <div class="ctrl-label">SIZE</div>
          <div class="sq-size-row">
            ${['XS','S','M','L','XL'].map(s =>
              `<button class="size-btn-popup" data-size="${s}">${s}</button>`
            ).join('')}
          </div>
        </div>
        <div class="qty-add-row">
          <div class="qty-block">
            <div class="ctrl-label">QTY</div>
            <div class="sq-qty-row">
              <button class="qty-btn-popup" id="sq-minus">−</button>
              <span class="sq-qty-val" id="sq-qty">1</span>
              <button class="qty-btn-popup" id="sq-plus">+</button>
            </div>
          </div>
          <button class="add-cart-popup-btn" id="sq-add-btn">ADD TO CART</button>
        </div>
      </div>`;

    right.append(itemsSec, infoSec, ctrlSec);
    layout.append(left, right);
    body.appendChild(layout);

    // Wire size buttons
    const sizeBtns = ctrlSec.querySelectorAll('.size-btn-popup');
    const addBtn   = ctrlSec.querySelector('#sq-add-btn');
    sizeBtns.forEach(btn => {
      btn.onclick = () => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = btn.dataset.size;
        addBtn.classList.add('glow');
      };
    });

    // Wire qty
    const qtyEl = ctrlSec.querySelector('#sq-qty');
    ctrlSec.querySelector('#sq-minus').onclick = () => {
      qty = Math.max(1, qty - 1); qtyEl.textContent = qty;
    };
    ctrlSec.querySelector('#sq-plus').onclick = () => {
      qty++; qtyEl.textContent = qty;
    };

    // Add to cart
    addBtn.onclick = () => {
      if (!selectedItem) { showFloatText('Select an item first!', '#ff6060'); return; }
      if (!selectedSize) { showFloatText('Select a size first!',  '#ff6060'); return; }
      Cart.add({ name: selectedItem.name, size: selectedSize, qty });
      showFloatText(`+${qty} ${selectedItem.name}`, '#4adf8a');
    };
  }

  // ── Cart body ──
  function buildCartBody(body) {
    const cartBody = document.createElement('div');
    cartBody.className = 'cart-body';
    refreshCartBody(cartBody);
    body.appendChild(cartBody);
  }

  function refreshCartBody(container) {
    container.innerHTML = '';
    const items = Cart.get();

    if (items.length === 0) {
      container.innerHTML = '<div class="cart-empty">Your cart is empty…</div>';
      return;
    }

    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <div class="cart-item-info">
          <strong>${item.name}</strong> — Size ${item.size}
        </div>
        <div class="cart-item-qty">
          <button class="cart-qty-btn" data-op="minus">−</button>
          <span class="cart-qty-val">${item.qty}</span>
          <button class="cart-qty-btn" data-op="plus">+</button>
        </div>
        <button class="cart-remove-btn" title="Remove">🗑</button>`;

      const qtyVal = row.querySelector('.cart-qty-val');

      row.querySelector('[data-op="minus"]').onclick = () => {
        const c = Cart.get();
        if (c[idx].qty > 1) { c[idx].qty--; Cart.save(c); qtyVal.textContent = c[idx].qty; updateSummary(); }
      };
      row.querySelector('[data-op="plus"]').onclick = () => {
        const c = Cart.get();
        c[idx].qty++; Cart.save(c); qtyVal.textContent = c[idx].qty; updateSummary();
      };
      row.querySelector('.cart-remove-btn').onclick = () => {
        const updated = Cart.get().filter((_, i) => i !== idx);
        Cart.save(updated);
        refreshCartBody(container);
      };

      container.appendChild(row);
    });

    const summary = document.createElement('div');
    summary.className = 'cart-summary';
    summary.id = 'cart-summary-line';
    container.appendChild(summary);
    updateSummary();

    function updateSummary() {
      const total = Cart.get().reduce((s, i) => s + i.qty, 0);
      const el = container.querySelector('#cart-summary-line');
      if (el) el.textContent = `Total items: ${total}`;
    }
  }

  // ── Generic body (About / FAQ) ──
  function buildGenericBody(body, squareId) {
    const div = document.createElement('div');
    div.className = 'generic-body';

    if (squareId === 'about-npc') {
      div.innerHTML = `
        <p style="color:#e03870;font-family:'Press Start 2P',monospace;font-size:0.65rem;margin-bottom:14px;">ABOUT US</p>
        <p>Welcome, traveler! We are <strong style="color:#e03870;">The Shop</strong> — a small brand crafting
        quality goods for adventurers like yourself.</p><br>
        <p>Every item is made with care and a little bit of magic. Our story began
        in a small village market and grew into something we're truly proud of.</p><br>
        <p>Thank you for stopping by!</p>`;
    } else if (squareId === 'faq-npc') {
      div.innerHTML = `
        <p style="color:#e03870;font-family:'Press Start 2P',monospace;font-size:0.65rem;margin-bottom:14px;">FAQ</p>
        <p><strong style="color:#c04878;">How long does shipping take?</strong><br>
        Typically 3–7 business days. Expedited options available at checkout.</p><br>
        <p><strong style="color:#c04878;">Can I return or exchange an item?</strong><br>
        Yes! Returns accepted within 30 days. Items must be in original condition.</p><br>
        <p><strong style="color:#c04878;">How do I pick the right size?</strong><br>
        Check the sizing chart in the shop. When in doubt, size up — we run slightly small.</p><br>
        <p><strong style="color:#c04878;">Do you ship internationally?</strong><br>
        Yes — to most regions. Delivery times and fees vary by destination.</p>`;
    }

    body.appendChild(div);
  }

  // ─────────────────────────────────────────
  //  FLOATING TEXT FEEDBACK
  // ─────────────────────────────────────────
  function showFloatText(msg, color = '#4adf8a') {
    const el = document.createElement('div');
    el.className   = 'float-text';
    el.textContent = msg;
    el.style.color = color;
    el.style.left  = '50%';
    el.style.top   = '50%';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  // ─────────────────────────────────────────
  //  PROXIMITY INDICATOR + NPC HIGHLIGHTING
  // ─────────────────────────────────────────
  function updateProximity() {
    const near = isNearSquare(playerEl, squares);
    player.setNear(near);
    proximityTip.classList.toggle('visible', near && !popupOpen && !dialogueActive);

    // Highlight the NPC station in range
    Object.values(squares).forEach(sq => {
      const d = getDistLocal(playerEl, sq);
      sq.classList.toggle('in-range', d < 90);
    });
  }

  function getDistLocal(el1, el2) {
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();
    const dx = Math.max(r2.left - r1.right, r1.left - r2.right, 0);
    const dy = Math.max(r2.top  - r1.bottom, r1.top - r2.bottom, 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ─────────────────────────────────────────
  //  INPUT
  // ─────────────────────────────────────────
  window.addEventListener('keydown', e => {
    if (e.key in keys) { e.preventDefault(); keys[e.key] = true; }

    if (e.key === 'e' || e.key === 'E') {
      if (!popupOpen && !dialogueActive && isNearSquare(playerEl, squares)) {
        const sq = getNearestSquare(playerEl, squares);
        if (sq) openDialogue(sq.id);
      }
    }
    if (e.key === 'Escape') {
      if (dialogueActive) closeDialogue();
      else if (popupOpen) closePopup();
    }
  });

  window.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
  });

  // Click on NPC to interact
  window.addEventListener('click', e => {
    const sq = Object.values(squares).find(s => s === e.target || s.contains(e.target));
    if (sq && !popupOpen && !dialogueActive && getDistLocal(playerEl, sq) < 90) {
      openDialogue(sq.id);
    }
  });

  // ─────────────────────────────────────────
  //  GAME LOOP
  // ─────────────────────────────────────────
  function loop() {
    if (!popupOpen && !dialogueActive) {
      player.move(keys, squares);
      const moving = keys.w || keys.a || keys.s || keys.d ||
                     keys.ArrowUp || keys.ArrowDown ||
                     keys.ArrowLeft || keys.ArrowRight;
      playerEl.classList.toggle('moving', moving);
    } else {
      playerEl.classList.remove('moving');
    }
    updateProximity();
    requestAnimationFrame(loop);
  }
  loop();
}
