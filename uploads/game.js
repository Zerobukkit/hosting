import { Player } from './player.js';
import { setupSquares, isNearSquare, getNearestSquare } from './utils.js';
import { Cart } from './cart.js';   // cookie-based cart storage

export function initGame() {
  const player = new Player(document.getElementById('player'));
  const popup = document.getElementById('popup');
  const squares = setupSquares();
  const keys = { w: false, a: false, s: false, d: false };
  let popupOpen = false;
  let dialogueActive = false;

  // === Dialogue Box ===
  const dialogueBox = document.createElement('div');
  dialogueBox.id = 'dialogue-box';
  dialogueBox.innerHTML = `
    <div class="dialogue-character">
      <img id="dialogue-npc-img" src="" alt="NPC" />
      <span id="dialogue-npc-name">NPC</span>
    </div>
    <div class="dialogue-text-container">
      <div id="dialogue-text"></div>
      <div class="dialogue-buttons" id="dialogue-buttons"></div>
    </div>
  `;
  document.body.appendChild(dialogueBox);

  // === Typewriter Effect ===
  // === Typewriter Effect (click-to-skip, scoped per dialogue) ===
  let typeInterval = null;
  let typingActive = false;

  function typeText(text, callback) {
    const box = document.getElementById('dialogue-text');
    const dialogueArea = document.getElementById('dialogue-box');
    box.innerHTML = '';
    let i = 0;
    const speed = 35;

    // Clear any existing typing
    if (typeInterval) clearInterval(typeInterval);
    typingActive = true;

    // Define skip handler (specific to this typing session)
    const skipHandler = () => {
      if (typingActive) {
        clearInterval(typeInterval);
        typeInterval = null;
        typingActive = false;
        box.innerHTML = text; // instantly complete text
        dialogueArea.removeEventListener('click', skipHandler); // detach after use
        if (callback) callback();
      }
    };

    // Attach listener only for this animation
    dialogueArea.addEventListener('click', skipHandler);

    typeInterval = setInterval(() => {
      box.innerHTML += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(typeInterval);
        typeInterval = null;
        typingActive = false;
        dialogueArea.removeEventListener('click', skipHandler); // detach safely
        if (callback) callback();
      }
    }, speed);
  }

  // === Dialogue Logic ===
  function startDialogue(squareId) {
    dialogueActive = true;
    popupOpen = true;
    dialogueBox.style.display = 'flex';
    dialogueBox.classList.remove('show');
    setTimeout(() => dialogueBox.classList.add('show'), 10);

    const npcName = document.getElementById('dialogue-npc-name');
    const npcImg = document.getElementById('dialogue-npc-img');
    const textBox = document.getElementById('dialogue-text');
    const btnBox = document.getElementById('dialogue-buttons');
    textBox.innerHTML = '';
    btnBox.innerHTML = '';

    const npcData = {
      'top-left': ['Hello traveler! Welcome to my humble corner.', 'Do you want to see my shop?', 'Shopkeeper', 'ShopNPC.png'],
      'top-right': ['Hi there! Curious about what we do here?', 'Do you want to know more about our brand?', 'Brand Rep', 'AboutNPC.png'],
      'bottom-left': ['Hey, checking what’s in your basket?', 'Do you want to see your cart?', 'Cart Manager', 'CartNPC.png'],
      'bottom-right': ['Hello! I’m here to help with anything you need.', 'Do you want to see the FAQ?', 'Support Bot', 'FAQNPC.png']
    }[squareId];

    const [greeting, question, npcLabel, npcImage] = npcData;
    npcName.textContent = npcLabel;
    npcImg.src = npcImage;

    renderDialogueButtons('none', squareId, question);
    typeText(greeting, () => renderDialogueButtons('first', squareId, question));
  }

  function renderDialogueButtons(stage, squareId, questionText) {
    const container = document.getElementById('dialogue-buttons');
    container.innerHTML = '';

    if (stage === 'first') {
      const next = document.createElement('button');
      next.id = 'dialogue-next';
      next.textContent = 'NEXT';
      next.onclick = () => {
        typeText(questionText, () => renderDialogueButtons('second', squareId, questionText));
      };
      const end = document.createElement('button');
      end.id = 'dialogue-end';
      end.textContent = 'END CHAT';
      end.onclick = closeDialogue;
      container.append(next, end);
    } else if (stage === 'second') {
      const yes = document.createElement('button');
      yes.id = 'dialogue-yes';
      yes.textContent = 'YES';
      yes.onclick = () => {
        closeDialogue();
        openPopup(squareId);
      };
      const no = document.createElement('button');
      no.id = 'dialogue-no';
      no.textContent = 'NO';
      no.onclick = closeDialogue;
      container.append(yes, no);
    }
  }

  function closeDialogue() {
    if (typeInterval) {
      clearInterval(typeInterval);
      typeInterval = null;
    }
    typingActive = false;

    // Clean up any residual click handlers
    const dialogueArea = document.getElementById('dialogue-box');
    const clone = dialogueArea.cloneNode(true);
    dialogueArea.parentNode.replaceChild(clone, dialogueArea);

    dialogueBox.classList.remove('show');
    setTimeout(() => {
      dialogueBox.style.display = 'none';
      dialogueActive = false;
      popupOpen = false;
    }, 200);
  }


  function closeDialogue() {
    dialogueBox.classList.remove('show');
    setTimeout(() => {
      dialogueBox.style.display = 'none';
      dialogueActive = false;
      popupOpen = false;
    }, 200);
  }

  // === Popup Logic ===
  function openPopup(squareId) {
    popup.style.display = 'flex';
    setTimeout(() => popup.classList.add('show'), 10);
    popupOpen = true;
    popup.className = 'shop-popup';
    popup.innerHTML = '';

    const npcMap = {
      'top-left': { title: 'Shop Items', icon: 'ShopNPC.png' },
      'top-right': { title: 'Our Brand', icon: 'AboutNPC.png' },
      'bottom-left': { title: 'Your Cart', icon: 'CartNPC.png' },
      'bottom-right': { title: 'FAQ', icon: 'FAQNPC.png' }
    };
    const npc = npcMap[squareId];

    const header = document.createElement('div');
    header.className = 'popup-header';
    header.innerHTML = `
      <div class="popup-header-left">
        <div class="popup-npc-frame"><img src="${npc.icon}" alt="NPC"></div>
        <div class="popup-header-title">${npc.title}</div>
      </div>
      <div class="popup-header-right">
        ${squareId === 'top-left' ? `<button class="popup-cart-btn" id="popup-cart-btn">VIEW CART</button>` : ''}
        <button class="popup-exit-btn" id="popup-exit-btn">EXIT</button>
      </div>
    `;
    popup.appendChild(header);

    const body = document.createElement('div');
    body.className = 'popup-body';

    // === SHOP POPUP ===
    if (squareId === 'top-left') {
      const leftPanel = document.createElement('div');
      leftPanel.className = 'shop-panel';
      leftPanel.id = 'item-info';
      leftPanel.style.width = '60%';
      leftPanel.innerHTML = `<h2>Item Info</h2><p>Select an item from the right to see details.</p>`;

      const rightColumn = document.createElement('div');
      rightColumn.style.width = '40%';
      rightColumn.style.display = 'flex';
      rightColumn.style.flexDirection = 'column';
      rightColumn.style.height = '100%';

      // Item list
      const itemListContainer = document.createElement('div');
      itemListContainer.className = 'shop-items';
      itemListContainer.style.flex = '1';
      itemListContainer.style.borderLeft = '2px solid #aaa';
      itemListContainer.style.borderBottom = '2px solid #aaa';
      itemListContainer.style.overflowY = 'auto';

      // Sizing chart
      const sizingChartContainer = document.createElement('div');
      sizingChartContainer.className = 'shop-panel';
      sizingChartContainer.style.flex = '1';
      sizingChartContainer.style.borderLeft = '2px solid #aaa';
      sizingChartContainer.innerHTML = `
        <h2>Sizing Chart</h2>
        <p>XS - Small<br>M - Medium<br>L - Large<br>XL - Extra Large</p>
      `;

      // Control container
      const controlContainer = document.createElement('div');
      controlContainer.className = 'shop-panel';
      controlContainer.style.flex = '0.7';
      controlContainer.style.borderLeft = '2px solid #aaa';
      controlContainer.style.display = 'flex';
      controlContainer.style.flexDirection = 'column';
      controlContainer.style.justifyContent = 'center';
      controlContainer.style.alignItems = 'center';
      controlContainer.innerHTML = `
        <div class="sizing-controls" style="width:90%; text-align:center;">
          <div class="size-buttons" style="justify-content:center;">
            ${['XS','S','M','L','XL'].map(s => `<button class="size-button">${s}</button>`).join('')}
          </div>
          <div class="bottom-controls" style="width:100%; margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
            <div class="quantity-controls" style="margin-left:10px;">
              <button class="qty-btn" id="qty-minus">-</button>
              <span class="qty-value" id="qty-value">1</span>
              <button class="qty-btn" id="qty-plus">+</button>
            </div>
            <button class="add-to-cart-btn" id="add-to-cart-btn" style="margin-right:10px;">Add to Cart</button>
          </div>
        </div>
      `;

      // Item data
      const items = Array.from({ length: 20 }, (_, i) => ({
        name: `Item ${i + 1}`,
        img: `https://via.placeholder.com/40x40?text=I${i + 1}`
      }));

      let selectedItem = null;
      items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';
        itemDiv.innerHTML = `<img src="${item.img}"><span>${item.name}</span>`;
        itemDiv.addEventListener('click', () => {
          selectedItem = item;
          leftPanel.innerHTML = `<h2>${item.name}</h2><p>Details for ${item.name}...</p>`;
        });
        itemListContainer.appendChild(itemDiv);
      });

      // Build layout
      rightColumn.append(itemListContainer, sizingChartContainer, controlContainer);
      body.append(leftPanel, rightColumn);
      popup.appendChild(body);

      document.getElementById('popup-exit-btn').onclick = closePopup;
      const cartBtn = document.getElementById('popup-cart-btn');
      if (cartBtn) {
        cartBtn.addEventListener('click', () => {
          // Instantly replace popup content instead of closing it first
          popup.classList.remove('show');
          popup.innerHTML = ''; // clear shop popup contents
          openPopup('bottom-left'); // open the cart immediately
        });
      }

      // === Button logic ===
      const addToCartBtn = controlContainer.querySelector('#add-to-cart-btn');
      const sizeButtons = controlContainer.querySelectorAll('.size-button');

      sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          sizeButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          addToCartBtn.classList.add('glow-ready');
        });
      });

      let qty = 1;
      const qtyVal = controlContainer.querySelector('#qty-value');
      const minus = controlContainer.querySelector('#qty-minus');
      const plus = controlContainer.querySelector('#qty-plus');

      minus.addEventListener('click', () => {
        qty = Math.max(1, qty - 1);
        qtyVal.textContent = qty;
      });
      plus.addEventListener('click', () => {
        qty++;
        qtyVal.textContent = qty;
      });

      addToCartBtn.addEventListener('click', () => {
        if (!selectedItem) {
          alert('Please select an item first!');
          return;
        }
        const selectedSize = controlContainer.querySelector('.size-button.active')?.textContent;
        if (!selectedSize) {
          alert('Please select a size!');
          return;
        }
        const newItem = { name: selectedItem.name, size: selectedSize, qty };
        Cart.add(newItem);

        // Floating +1 animation
        const floatText = document.createElement('div');
        floatText.textContent = `+${qty} ${selectedItem.name}`;
        floatText.style.cssText = `
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-weight: bold; font-size: 1.2rem; color: #2e89ff;
          text-shadow: 1px 1px 3px #000; opacity: 1;
          animation: floatUp 1s ease-out forwards; z-index: 9999;
        `;
        document.body.appendChild(floatText);
        setTimeout(() => floatText.remove(), 1000);
      });
    }

    // === CART POPUP ===
    else if (squareId === 'bottom-left') {
      const cartItems = Cart.get();
      const cartBody = document.createElement('div');
      cartBody.style.padding = '20px';
      cartBody.style.overflowY = 'auto';

      if (cartItems.length === 0) {
        cartBody.innerHTML = '<p>Your cart is empty.</p>';
      } else {
        const title = document.createElement('h2');
        title.textContent = 'Your Cart';
        cartBody.appendChild(title);

        const summary = document.createElement('div');
        summary.style.marginTop = '10px';
        summary.style.textAlign = 'center';
        summary.style.fontWeight = 'bold';

        function updateSummary() {
          const items = Cart.get();
          const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
          summary.innerHTML = `<p><strong>Total Items:</strong> ${totalItems}</p>`;
        }

        updateSummary();

        cartItems.forEach((item, index) => {
          const div = document.createElement('div');
          div.style.cssText = `
            border:1px solid #aaa; border-radius:6px; padding:8px;
            margin:6px 0; background:linear-gradient(to bottom,#fff,#e6e6e6);
            display:flex; justify-content:space-between; align-items:center;
          `;
          const info = document.createElement('div');
          info.innerHTML = `<strong>${item.name}</strong> — Size ${item.size}`;
          const qtyControls = document.createElement('div');
          qtyControls.innerHTML = `
            <button class="qty-btn small" data-type="minus">-</button>
            <span class="qty-value small">${item.qty}</span>
            <button class="qty-btn small" data-type="plus">+</button>
          `;
          const removeBtn = document.createElement('button');
          removeBtn.className = 'cart-remove-btn';
          removeBtn.textContent = '🗑';
          removeBtn.title = 'Remove Item';
          removeBtn.style.cursor = 'pointer';
          div.append(info, qtyControls, removeBtn);
          cartBody.appendChild(div);

          const minusBtn = qtyControls.querySelector('[data-type="minus"]');
          const plusBtn = qtyControls.querySelector('[data-type="plus"]');
          const qtyVal = qtyControls.querySelector('.qty-value');

          minusBtn.addEventListener('click', () => {
            let cart = Cart.get();
            if (cart[index].qty > 1) {
              cart[index].qty -= 1;
              Cart.save(cart);
              qtyVal.textContent = cart[index].qty;
              updateSummary();
            }
          });

          plusBtn.addEventListener('click', () => {
            let cart = Cart.get();
            cart[index].qty += 1;
            Cart.save(cart);
            qtyVal.textContent = cart[index].qty;
            updateSummary();
          });

          removeBtn.addEventListener('click', () => {
            const updated = Cart.get().filter((_, i) => i !== index);
            Cart.save(updated);
            div.remove();
            updateSummary();
            if (updated.length === 0) cartBody.innerHTML = '<p>Your cart is empty.</p>';
          });
        });

        cartBody.appendChild(summary);
      }

      body.appendChild(cartBody);
      popup.appendChild(body);
      document.getElementById('popup-exit-btn').onclick = closePopup;
    }

    // === OTHER POPUPS ===
    else {
      body.innerHTML = `<div style="padding:20px;font-size:1rem;"><p>Content for ${npc.title} goes here.</p></div>`;
      popup.appendChild(body);
      document.getElementById('popup-exit-btn').onclick = closePopup;
    }
  }

  function closePopup() {
    popup.classList.remove('show');
    setTimeout(() => {
      popup.style.display = 'none';
      popup.innerHTML = '';
      popupOpen = false;
    }, 200);
  }

  // === Controls ===
  window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
    if (key === 'e' && !popupOpen && isNearSquare(player.el, squares)) {
      const sq = getNearestSquare(player.el, squares);
      if (sq) startDialogue(sq.id);
    }
    if (key === 'escape' && (popupOpen || dialogueActive)) {
      if (dialogueActive) closeDialogue();
      else closePopup();
    }
  });

  window.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
  });

  window.addEventListener('click', e => {
    const sq = Object.values(squares).find(s => e.target === s);
    if (sq && isNearSquare(player.el, squares) && !popupOpen && !dialogueActive) {
      startDialogue(sq.id);
    }
  });

  // === Loop ===
  function loop() {
    if (!popupOpen && !dialogueActive) {
      player.move(keys, squares);
      player.updateAppearance(isNearSquare(player.el, squares));
    }
    requestAnimationFrame(loop);
  }
  loop();
}
