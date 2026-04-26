import { checkCollision } from './utils.js';

export class Player {
  constructor(el) {
    this.el = el;
    this.speed = 5;
  }

  move(keys, squares) {
    const maxLeft = window.innerWidth - this.el.offsetWidth;
    const maxTop = window.innerHeight - this.el.offsetHeight;

    let top = this.el.offsetTop;
    let left = this.el.offsetLeft;
    const prevTop = top;
    const prevLeft = left;

    if (keys.w) top -= this.speed;
    if (keys.s) top += this.speed;
    if (keys.a) left -= this.speed;
    if (keys.d) left += this.speed;

    top = Math.max(0, Math.min(top, maxTop));
    left = Math.max(0, Math.min(left, maxLeft));

    // Tentatively move
    this.el.style.top = top + 'px';
    this.el.style.left = left + 'px';

    // Check for collision — if colliding, revert
    for (const sq of Object.values(squares)) {
      if (checkCollision(this.el, sq)) {
        this.el.style.top = prevTop + 'px';
        this.el.style.left = prevLeft + 'px';
        break;
      }
    }
  }

  updateAppearance(isNear) {
    this.el.style.border = isNear ? '4px solid red' : 'none';
  }
}
