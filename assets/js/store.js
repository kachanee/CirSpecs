/* ===========================================================================
   CirSpecs — application state
   One object, one localStorage key, one save(). Views read from here and call
   the mutators below; nothing writes to CS.state directly.
   =========================================================================== */

window.CS = window.CS || {};

(function (CS) {
  'use strict';

  var P = CS.pricing;
  var KEY = 'cirspecs.store.v2';

  /* day      — how far the time simulation has been wound forward
     mode     — 'pickup' | 'delivery', decides which stock is sellable
     cart/don — { productId: quantity }
     fav      — { productId: 1 }
     profile  — which shopper history drives the recommendations           */
  var state = {
    day: 0, playing: false,
    mode: 'pickup', cat: 'All', query: '', sort: 'rec',
    cart: {}, don: {}, fav: {}, orders: [],
    promo: null, partner: 'a', profile: ''
  };

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) {
      state.cart    = saved.cart    || {};
      state.don     = saved.don     || {};
      state.fav     = saved.fav     || {};
      state.orders  = saved.orders  || [];
      state.mode    = saved.mode    || 'pickup';
      state.partner = saved.partner || 'a';
      state.profile = saved.profile || '';
    }
  } catch (e) { /* private browsing, corrupt payload — start fresh */ }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        cart: state.cart, don: state.don, fav: state.fav, orders: state.orders,
        mode: state.mode, partner: state.partner, profile: state.profile
      }));
    } catch (e) { /* storage full or blocked; the session still works */ }
  }

  /* --- lookups ----------------------------------------------------------- */

  function byId(id) {
    for (var i = 0; i < CS.PRODUCTS.length; i++) {
      if (CS.PRODUCTS[i].id === id) return CS.PRODUCTS[i];
    }
    return null;
  }
  function daysLeft(p)  { return p.left0 - state.day; }
  function sellable(p)  { return P.sellable(p, daysLeft(p), state.mode); }
  function donatable(p) { return P.donatable(p, daysLeft(p)); }
  function partnerOf(id) {
    for (var i = 0; i < CS.PARTNERS.length; i++) {
      if (CS.PARTNERS[i].id === id) return CS.PARTNERS[i];
    }
    return CS.PARTNERS[0];
  }

  /* --- lines and totals -------------------------------------------------- */

  function linesFrom(bag, routeMode) {
    return Object.keys(bag).map(function (id) {
      var p = byId(id);
      if (!p) return null;
      var left = daysLeft(p);
      return {
        p: p, qty: bag[id], left: left,
        price: P.priceAt(p, left),
        ok: P.sellable(p, left, routeMode)
      };
    }).filter(Boolean);
  }

  function cartLines() { return linesFrom(state.cart, state.mode); }
  function donLines()  { return linesFrom(state.don, 'pickup'); }

  /* Everything the cart, the checkout and the receipt need, in one pass. */
  function totals() {
    var t = { sum:0, base:0, units:0, co2:0, blocked:0, donSum:0, donUnits:0 };

    cartLines().forEach(function (l) {
      if (!l.ok) { t.blocked++; return; }
      t.sum  += l.price * l.qty;
      t.base += l.p.base * l.qty;
      t.units += l.qty;
      t.co2  += CS.CO2[l.p.group] * l.qty;
    });

    donLines().forEach(function (l) {
      if (!l.ok) { t.blocked++; return; }
      t.donSum   += l.price * l.qty;
      t.base     += l.p.base * l.qty;
      t.donUnits += l.qty;
      t.co2      += CS.CO2[l.p.group] * l.qty;
    });

    t.ship  = (state.mode === 'delivery' && t.sum > 0 && t.sum < CS.FREE_SHIP) ? CS.SHIP_FEE : 0;
    t.disc  = state.promo ? Math.round(t.sum * state.promo.pct / 100) : 0;
    t.total = Math.max(0, t.sum - t.disc + t.ship + t.donSum);
    t.saved = t.base - t.sum - t.donSum + t.disc;
    return t;
  }

  function count(bag) {
    return Object.keys(bag).reduce(function (n, k) { return n + bag[k]; }, 0);
  }
  function basketCount() { return count(state.cart) + count(state.don); }

  /* --- mutators ---------------------------------------------------------- */

  function addToCart(id, qty) {
    var p = byId(id);
    if (!p) return false;
    state.cart[id] = Math.min((state.cart[id] || 0) + qty, p.cap);
    save();
    return true;
  }

  function addToDonation(id, qty) {
    var p = byId(id);
    if (!p || !donatable(p)) return false;
    state.don[id] = Math.min((state.don[id] || 0) + qty, p.cap);
    save();
    return true;
  }

  function bump(bag, id, delta) {
    var p = byId(id);
    if (!p) return;
    var next = (bag[id] || 0) + delta;
    if (next <= 0) delete bag[id];
    else bag[id] = Math.min(next, p.cap);
    save();
  }
  function drop(bag, id) { delete bag[id]; save(); }

  function toggleFav(id) {
    if (state.fav[id]) delete state.fav[id];
    else state.fav[id] = 1;
    save();
    return !!state.fav[id];
  }

  function applyPromo(code) {
    var c = String(code || '').trim().toUpperCase();
    state.promo = (c === 'SAVE10') ? { code:'SAVE10', pct:10 } : null;
    return state.promo;
  }

  /* Turn the current basket into an order, then empty it. */
  function placeOrder() {
    var t = totals();
    if (!t.units && !t.donUnits) return null;

    var pack = function (l) {
      return { id:l.p.id, name:l.p.name, qty:l.qty, price:l.price, left:l.left };
    };
    var order = {
      code: (t.units ? 'CS-' : 'DN-') +
            Math.random().toString(36).slice(2, 6).toUpperCase() +
            Math.floor(10 + Math.random() * 89),
      at: Date.now(),
      mode: state.mode,
      own: t.units,
      units: t.units + t.donUnits,
      donUnits: t.donUnits,
      partner: t.donUnits ? partnerOf(state.partner).name : '',
      co2: t.co2,
      saved: t.saved,
      total: t.total,
      items: cartLines().filter(function (l) { return l.ok; }).map(pack),
      don:   donLines().filter(function (l) { return l.ok; }).map(pack)
    };

    state.orders.unshift(order);
    state.cart = {}; state.don = {}; state.promo = null;
    save();
    return order;
  }

  function donatedTotal() {
    return state.orders.reduce(function (n, o) {
      return n + (o.donUnits || 0);
    }, CS.DON_BASE.units);
  }

  /* --- catalogue views ---------------------------------------------------- */

  var SORTS = {
    rec: function (a, b) { return (sellable(b) - sellable(a)) || (a.left0 - b.left0); },
    cut: function (a, b) { return P.discountPct(b, daysLeft(b)) - P.discountPct(a, daysLeft(a)); },
    lo:  function (a, b) { return P.priceAt(a, daysLeft(a)) - P.priceAt(b, daysLeft(b)); },
    hi:  function (a, b) { return P.priceAt(b, daysLeft(b)) - P.priceAt(a, daysLeft(a)); },
    exp: function (a, b) { return daysLeft(a) - daysLeft(b); }
  };

  function visibleProducts() {
    var q = state.query.trim().toLowerCase();
    return CS.PRODUCTS.filter(function (p) {
      if (state.cat !== 'All' && p.cat !== state.cat) return false;
      if (q && (p.name + ' ' + p.brand + ' ' + p.cat + ' ' + p.store).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(SORTS[state.sort] || SORTS.rec);
  }

  function categories() {
    var seen = ['All'];
    CS.PRODUCTS.forEach(function (p) {
      if (seen.indexOf(p.cat) < 0) seen.push(p.cat);
    });
    return seen;
  }

  /* --- recommendations ---------------------------------------------------- */
  /* A rule-based stand-in for a purchase-behaviour model: same aisle, bought
     together, same brand, same format, nudged by how close the date is.     */

  function realHistory() {
    var h = {};
    state.orders.forEach(function (o) {
      o.items.concat(o.don || []).forEach(function (i) { h[i.id] = Math.max(h[i.id] || 0, 3); });
    });
    Object.keys(state.cart).forEach(function (id) { h[id] = Math.max(h[id] || 0, 2); });
    Object.keys(state.fav).forEach(function (id)  { h[id] = Math.max(h[id] || 0, 1); });
    return h;
  }

  function activeProfile() {
    var hasOwn = Object.keys(realHistory()).length > 0;
    var pf = state.profile;
    if (pf === 'mine' && !hasOwn) pf = '';
    if (!pf) pf = hasOwn ? 'mine' : 'student';
    return pf;
  }

  function shortName(p) { return p.name.split(',')[0]; }

  function recommend() {
    var pf = activeProfile();
    var history = {};
    if (pf === 'mine') history = realHistory();
    else CS.PROFILES[pf].hist.forEach(function (id) { history[id] = 3; });

    var scored = [];
    CS.PRODUCTS.forEach(function (p) {
      if (history[p.id] || !sellable(p)) return;

      var score = 0, best = 0, why = '';
      Object.keys(history).forEach(function (hid) {
        var seed = byId(hid), w = history[hid];
        if (!seed) return;

        if ((CS.TOGETHER[hid] || []).indexOf(p.id) >= 0) {
          var v = 3 * w; score += v;
          if (v > best) { best = v; why = 'Often bought together with ' + shortName(seed); }
        }
        if (seed.cat === p.cat) {
          var v2 = 2 * w; score += v2;
          if (v2 > best) { best = v2; why = 'You shop ' + p.cat.toLowerCase() + ' (' + shortName(seed) + ')'; }
        }
        if (seed.brand === p.brand) score += w;
        if (seed.group === p.group) score += 0.7 * w;
      });

      score += (1 - daysLeft(p) / (p.left0 + 10)) * 0.8;
      scored.push({ p:p, score:score, why: why || 'Close to its date at a big discount' });
    });

    return scored.sort(function (a, b) { return b.score - a.score; })
      .slice(0, 4)
      .map(function (r) {
        r.match = Math.max(58, Math.min(97, Math.round(52 + r.score * 2.1)));
        return r;
      });
  }

  CS.state = state;
  CS.store = {
    save: save,
    byId: byId, daysLeft: daysLeft, sellable: sellable, donatable: donatable,
    partnerOf: partnerOf,
    cartLines: cartLines, donLines: donLines, totals: totals,
    count: count, basketCount: basketCount,
    addToCart: addToCart, addToDonation: addToDonation,
    bump: bump, drop: drop, toggleFav: toggleFav, applyPromo: applyPromo,
    placeOrder: placeOrder, donatedTotal: donatedTotal,
    visibleProducts: visibleProducts, categories: categories,
    realHistory: realHistory, activeProfile: activeProfile,
    shortName: shortName, recommend: recommend
  };

})(window.CS);
