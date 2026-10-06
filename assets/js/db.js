/* ===========================================================================
   CirSpecs — demo database and API
   There is no server, so this file plays the part of one. It keeps four
   tables in localStorage, applies the seller's rules onto the catalogue, and
   exposes a small REST-shaped facade (CS.api) whose methods return Promises.
   To go live, keep CS.api's method names and replace the bodies with fetch().

   Tables
     sellers   id, name, km
     products  id, sellerId, name, base, floorPct, maxCut, stock, cap, left0, updatedAt
     orders    code, at, mode, units, donUnits, total, saved, co2, items[], don[]
     events    id, at, type, table, ref, detail          (the audit log)
   =========================================================================== */

window.CS = window.CS || {};

(function (CS) {
  'use strict';

  var KEY = 'cirspecs.db.v1';
  var db = { sellers: [], products: [], orders: [], events: [], seq: 0 };

  /* What the catalogue looked like before any seller edited it, so a reset can
     put it back. */
  var ORIGINAL = {};
  CS.PRODUCTS.forEach(function (p) {
    ORIGINAL[p.id] = { base: p.base, floorPct: p.floorPct, maxCut: p.maxCut };
  });

  /* A seeded baseline so the impact counters are not empty on first visit.
     Illustrative, like the donation base in data.js. */
  var IMPACT_BASE = { units: 3216, saved: 148500000, co2: 1925000 };

  function now() { return Date.now(); }

  function log(type, table, ref, detail) {
    db.events.unshift({ id: ++db.seq, at: now(), type: type, table: table, ref: ref || '', detail: detail || '' });
    if (db.events.length > 80) db.events.length = 80;
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* blocked storage: still works in memory */ }
  }

  /* --- seed and load ------------------------------------------------------- */

  function seed() {
    db = { sellers: [], products: [], orders: [], events: [], seq: 0 };
    var seen = {};
    CS.PRODUCTS.forEach(function (p, i) {
      if (!seen[p.store]) {
        seen[p.store] = 's' + (db.sellers.length + 1);
        db.sellers.push({ id: seen[p.store], name: p.store, km: p.km });
      }
      var o = ORIGINAL[p.id];
      db.products.push({
        id: p.id, sellerId: seen[p.store], name: p.name,
        base: o.base, floorPct: o.floorPct, maxCut: o.maxCut,
        stock: i === 0 ? 5 : p.cap * 3 + (i % 4) * 2,
        cap: p.cap, left0: p.left0, updatedAt: now()
      });
    });
    log('seed', 'products', '', 'Seeded ' + db.products.length + ' products from the catalogue');
    persist();
  }

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.products && s.products.length) db = s;
    } catch (e) { /* corrupt payload: fall through to seed */ }
    if (!db.products.length) seed();
  }

  /* Push the table's editable fields onto the live catalogue objects. */
  function apply() {
    db.products.forEach(function (row) {
      var p = CS.PRODUCTS.filter(function (x) { return x.id === row.id; })[0];
      if (!p) return;
      p.base = row.base; p.floorPct = row.floorPct; p.maxCut = row.maxCut; p.stock = row.stock;
    });
  }

  /* --- reads --------------------------------------------------------------- */

  function table(name) { return db[name] || []; }
  function row(name, id) {
    var key = name === 'orders' ? 'code' : 'id';
    return table(name).filter(function (r) { return r[key] === id; })[0] || null;
  }

  function stats() {
    var s = { orders: db.orders.length, units: IMPACT_BASE.units, saved: IMPACT_BASE.saved, co2: IMPACT_BASE.co2, donated: CS.DON_BASE.units };
    db.orders.forEach(function (o) {
      s.units += o.units || 0; s.saved += o.saved || 0; s.co2 += o.co2 || 0; s.donated += o.donUnits || 0;
    });
    s.kg = Math.round(s.co2 / 1000);
    return s;
  }

  /* --- writes -------------------------------------------------------------- */

  function validate(patch) {
    var out = {};
    if ('base' in patch)     out.base     = Math.round(Math.min(2000000, Math.max(1000, +patch.base || 0)) / 500) * 500;
    if ('floorPct' in patch) out.floorPct = Math.round(Math.min(95, Math.max(5, +patch.floorPct || 0)));
    if ('maxCut' in patch)   out.maxCut   = Math.round(Math.min(90, Math.max(5, +patch.maxCut || 0)));
    if ('stock' in patch)    out.stock    = Math.round(Math.min(999, Math.max(0, +patch.stock || 0)));
    return out;
  }

  function updateProduct(id, patch) {
    var r = row('products', id);
    if (!r) return null;
    var clean = validate(patch), changed = [];
    Object.keys(clean).forEach(function (k) {
      if (r[k] !== clean[k]) { changed.push(k + ' ' + r[k] + ' → ' + clean[k]); r[k] = clean[k]; }
    });
    if (changed.length) {
      r.updatedAt = now();
      log('update', 'products', id, changed.join(', '));
      apply(); persist();
    }
    return r;
  }

  /* Called by the store when an order is placed. Takes stock off the shelf. */
  function recordOrder(order) {
    var take = function (list) {
      (list || []).forEach(function (i) {
        var r = row('products', i.id);
        if (r) r.stock = Math.max(0, r.stock - i.qty);
      });
    };
    take(order.items); take(order.don);
    db.orders.unshift({
      code: order.code, at: order.at, mode: order.mode, units: order.units, donUnits: order.donUnits,
      total: order.total, saved: order.saved, co2: order.co2,
      items: (order.items || []).map(function (i) { return { id: i.id, qty: i.qty, price: i.price }; }),
      don: (order.don || []).map(function (i) { return { id: i.id, qty: i.qty, price: i.price }; })
    });
    log('insert', 'orders', order.code, order.units + ' item(s), ' + Math.round(order.total).toLocaleString('en-US') + ' ₫');
    apply(); persist();
  }

  function reset() {
    CS.PRODUCTS.forEach(function (p) {
      var o = ORIGINAL[p.id]; p.base = o.base; p.floorPct = o.floorPct; p.maxCut = o.maxCut;
    });
    seed(); apply();
    log('reset', 'all', '', 'Database reset to the seed data');
    persist();
  }

  function exportJson() { return JSON.stringify(db, null, 2); }

  /* --- REST-shaped facade --------------------------------------------------
     Every call is async and takes a little while, so the front end is already
     written the way it will need to be once a real server sits behind it.   */

  function reply(fn) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try { resolve(fn()); } catch (e) { reject(e); }
      }, 140);
    });
  }

  function http(method, path, body) {
    var m = String(method).toUpperCase(), parts = String(path).replace(/^\/+|\/+$/g, '').split('/');
    return reply(function () {
      var res = parts[0], id = parts[1];
      if (m === 'GET' && res === 'products') {
        if (!id) return { status: 200, data: table('products') };
        var p = row('products', id);
        return p ? { status: 200, data: p } : { status: 404, error: 'No product ' + id };
      }
      if (m === 'PATCH' && res === 'products' && id) {
        var u = updateProduct(id, body || {});
        return u ? { status: 200, data: u } : { status: 404, error: 'No product ' + id };
      }
      if (m === 'GET' && res === 'sellers') return { status: 200, data: table('sellers') };
      if (m === 'GET' && res === 'orders')  return { status: 200, data: table('orders') };
      if (m === 'GET' && res === 'events')  return { status: 200, data: table('events') };
      if (m === 'GET' && res === 'stats')   return { status: 200, data: stats() };
      if (m === 'POST' && res === 'reset')  { reset(); return { status: 200, data: { ok: true } }; }
      return { status: 404, error: 'No route for ' + m + ' /' + parts.join('/') };
    });
  }

  load();
  apply();

  CS.db = {
    table: table, row: row, stats: stats,
    updateProduct: updateProduct, recordOrder: recordOrder,
    reset: reset, exportJson: exportJson
  };
  CS.api = {
    get:   function (path) { return http('GET', path); },
    patch: function (path, body) { return http('PATCH', path, body); },
    post:  function (path, body) { return http('POST', path, body); }
  };

})(window.CS);
