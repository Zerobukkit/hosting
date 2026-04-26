// cart.js — cookie-based cart storage
export const Cart = {
  get() {
    const cookie = document.cookie.split('; ').find(r => r.startsWith('gameCart='));
    try {
      return cookie ? JSON.parse(decodeURIComponent(cookie.split('=')[1])) : [];
    } catch { return []; }
  },
  save(cart) {
    document.cookie = `gameCart=${encodeURIComponent(JSON.stringify(cart))};path=/;max-age=${60 * 60 * 24 * 30}`;
  },
  add(item) {
    const cart = this.get();
    const existing = cart.find(i => i.name === item.name && i.size === item.size);
    if (existing) existing.qty += item.qty;
    else cart.push(item);
    this.save(cart);
  },
  clear() {
    document.cookie = 'gameCart=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
};
