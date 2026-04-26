export function setupSquares() {
  // Move squares 7cm (≈ 264.6px) from edges
  const offset = 264.6;
  const squares = {
    topLeft: document.getElementById('top-left'),
    topRight: document.getElementById('top-right'),
    bottomLeft: document.getElementById('bottom-left'),
    bottomRight: document.getElementById('bottom-right')
  };

  squares.topLeft.style.top = `${offset}px`;
  squares.topLeft.style.left = `${offset}px`;

  squares.topRight.style.top = `${offset}px`;
  squares.topRight.style.right = `${offset}px`;

  squares.bottomLeft.style.bottom = `${offset}px`;
  squares.bottomLeft.style.left = `${offset}px`;

  squares.bottomRight.style.bottom = `${offset}px`;
  squares.bottomRight.style.right = `${offset}px`;

  return squares;
}

// Get pixel distance between two elements (edge to edge)
export function getDistance(el1, el2) {
  const r1 = el1.getBoundingClientRect();
  const r2 = el2.getBoundingClientRect();

  const dx = Math.max(r2.left - r1.right, r1.left - r2.right, 0);
  const dy = Math.max(r2.top - r1.bottom, r1.top - r2.bottom, 0);

  return Math.sqrt(dx * dx + dy * dy);
}

// Proximity detection (2cm ≈ 75.6px)
export function isNearSquare(player, squares) {
  const threshold = 75.6;
  return Object.values(squares).some(sq => getDistance(player, sq) < threshold);
}

// Collision detection (prevents overlapping)
export function checkCollision(el1, el2) {
  const r1 = el1.getBoundingClientRect();
  const r2 = el2.getBoundingClientRect();

  return !(
    r1.right < r2.left ||
    r1.left > r2.right ||
    r1.bottom < r2.top ||
    r1.top > r2.bottom
  );
}
export function getNearestSquare(player, squares) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const sq of Object.values(squares)) {
    const dist = getDistance(player, sq);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = sq;
    }
  }
  return nearest;
}
