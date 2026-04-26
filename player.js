// player.js — Player class
import { checkCollision } from './utils.js';

export class Player {
  constructor(el) {
    this.el = el;
    this.speed = 4;
  }

  move(keys, squares) {
    const maxLeft = window.innerWidth  - this.el.offsetWidth;
    const maxTop  = window.innerHeight - this.el.offsetHeight;

    let top  = this.el.offsetTop;
    let left = this.el.offsetLeft;
    const prevTop  = top;
    const prevLeft = left;

    if (keys.w || keys.ArrowUp)    top  -= this.speed;
    if (keys.s || keys.ArrowDown)  top  += this.speed;
    if (keys.a || keys.ArrowLeft)  left -= this.speed;
    if (keys.d || keys.ArrowRight) left += this.speed;

    top  = Math.max(0, Math.min(top,  maxTop));
    left = Math.max(0, Math.min(left, maxLeft));

    this.el.style.top  = top  + 'px';
    this.el.style.left = left + 'px';

    // Revert if colliding with any NPC station
    for (const sq of Object.values(squares)) {
      if (checkCollision(this.el, sq)) {
        this.el.style.top  = prevTop  + 'px';
        this.el.style.left = prevLeft + 'px';
        break;
      }
    }
  }

  setNear(isNear) {
    this.el.classList.toggle('near-npc', isNear);
  }
}
