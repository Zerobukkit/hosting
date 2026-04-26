// utils.js — geometry helpers and image-surface-aware NPC positioning
//
// Background image: center 55% / cover on 1920×1080
// Station coordinates are tuned to match the four positions in the
// reference screenshot (red/green/blue/no-outline boxes):
//   FAQ   — upper-left, on the bookshelf
//   SHOP  — middle-right, on the purple table
//   ABOUT — bottom-left, on the stone floor
//   CART  — bottom-right, on the stone floor

export function setupSquares() {
  const stations = {
    faq:   document.getElementById('faq-npc'),
    shop:  document.getElementById('shop-npc'),
    about: document.getElementById('about-npc'),
    cart:  document.getElementById('cart-npc'),
  };

  Object.values(stations).forEach(el => {
    el.style.right  = '';
    el.style.bottom = '';
    // width auto-scales with the (height-driven) sprite
    el.style.width  = 'auto';
  });

  // FAQ — green outline: sitting on the top of the left bookshelf
  stations.faq.style.top  = '28%';
  stations.faq.style.left = '6%';

  // SHOP — blue outline: standing on the bare purple table (right of the scroll)
  stations.shop.style.top  = '48%';
  stations.shop.style.left = '62%';

  // ABOUT — red outline: stone floor, bottom-left
  stations.about.style.top  = '72%';
  stations.about.style.left = '8%';

  // CART — last box: stone floor, bottom-right
  stations.cart.style.top  = '72%';
  stations.cart.style.left = '80%';

  return stations;
}

// Edge-to-edge pixel distance between two elements
export function getDistance(el1, el2) {
  const r1 = el1.getBoundingClientRect();
  const r2 = el2.getBoundingClientRect();
  const dx = Math.max(r2.left - r1.right, r1.left - r2.right, 0);
  const dy = Math.max(r2.top  - r1.bottom, r1.top - r2.bottom, 0);
  return Math.sqrt(dx * dx + dy * dy);
}

// Returns true if player is within interaction range of any NPC
export function isNearSquare(player, squares) {
  const threshold = 110;
  return Object.values(squares).some(sq => getDistance(player, sq) < threshold);
}

// Returns the nearest NPC station element
export function getNearestSquare(player, squares) {
  let nearest = null, nearestDist = Infinity;
  for (const sq of Object.values(squares)) {
    const d = getDistance(player, sq);
    if (d < nearestDist) { nearestDist = d; nearest = sq; }
  }
  return nearest;
}

// AABB collision — returns true if two elements overlap
export function checkCollision(el1, el2) {
  const r1 = el1.getBoundingClientRect();
  const r2 = el2.getBoundingClientRect();
  return !(r1.right < r2.left || r1.left > r2.right ||
           r1.bottom < r2.top  || r1.top  > r2.bottom);
}
