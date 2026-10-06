/* ===========================================================================
   CirSpecs — extra views
   Impact counters, price alerts for saved items, the "wait or buy" advisor,
   the store map, the seller console and the database inspector. Same rules
   as the rest: builders return strings, and the only mutations live in the
   handlers wired once at the bottom (init).
   =========================================================================== */

window.CS = window.CS || {};

(function (CS) {
  'use strict';

  var P = CS.pricing, S = CS.state, store = CS.store, ui = CS.ui, db = CS.db;
  var esc = ui.esc, vnd = ui.vnd, num = ui.num, icon = ui.icon;

  var host = { render: function () {}, refresh: function () {}, toast: function () {} };

  /* ================================================== impact counters */

  function impactBand() {
    var s = db.stats();
    var fig = function (value, label) {
      return '<div class="figure"><b>' + value + '</b><span>' + label + '</span></div>';
    };
    return '<section class="band band--tight band--paper" id="impact"><div class="shell">' +
      '<p class="eyebrow">What this shelf has done</p>' +
      '<div class="figures impact">' +
        fig(vnd(s.saved), 'saved by shoppers') +
        fig(num(s.units), 'items kept out of the bin') +
        fig(num(s.kg) + ' kg', 'CO₂e avoided') +
        fig(num(s.donated), 'items donated') +
      '</div>' +
      '<p class="note">Counted from the demo database: a seeded baseline plus the ' + s.orders +
      ' order' + (s.orders === 1 ? '' : 's') + ' placed in this browser. Place an order and watch it move.</p>' +
      '</div></section>';
  }

  /* ============================================== alerts on saved items */

  function dropsFor(list, within) {
    return list.map(function (p) {
      var left = store.daysLeft(p), d = P.nextDrop(left);
      if (d === null || d > within || !store.sellable(p)) return null;
      var from = P.priceAt(p, left), to = P.priceAt(p, left - d);
      return to < from ? { p: p, days: d, from: from, to: to } : null; /* a step the floor swallows is no drop */
    }).filter(Boolean).sort(function (a, b) { return a.days - b.days; });
  }

  function savedProducts() {
    return CS.PRODUCTS.filter(function (p) { return S.fav[p.id]; });
  }

  function alertsBand() {
    var hits = dropsFor(savedProducts(), 3);
    if (!hits.length) return '';
    return '<section class="band band--tight"><div class="shell"><div class="alertbox">' +
      '<p class="alertbox__title">' + icon('clock', 17, '#0B6B42') + ' ' + hits.length +
      ' saved item' + (hits.length === 1 ? '' : 's') + ' about to drop</p><ul>' +
      hits.map(function (h) {
        return '<li><a href="#/p/' + h.p.id + '">' + esc(store.shortName(h.p)) + '</a> ' +
          (h.days === 1 ? 'drops tomorrow' : 'drops in ' + h.days + ' days') +
          ': <s>' + vnd(h.from) + '</s> <b>' + vnd(h.to) + '</b></li>';
      }).join('') + '</ul></div></div></section>';
  }

  function savedNote(p) {
    var h = dropsFor([p], 14)[0];
    if (!h) return '';
    return '<p class="rec__why"><b>Alert</b> &middot; ' +
      (h.days === 1 ? 'Drops tomorrow' : 'Drops in ' + h.days + ' days') + ' to ' + vnd(h.to) + '</p>';
  }

  /* ========================================= wait-or-buy advisor (product) */

  function advice(p) {
    var left = store.daysLeft(p), thr = CS.FLOORS[p.group][S.mode];
    var shelf = left - thr;                       /* days until it leaves this route */
    var drop = P.nextDrop(left);
    var price = P.priceAt(p, left);
    var next = drop === null ? price : P.priceAt(p, left - drop);
    var save = price - next;

    if (p.stock !== undefined && p.stock <= 5) {
      return { tone: 'buy', title: 'Buy now', detail: 'Only ' + p.stock + ' left from the seller, and stock is the faster clock here.' };
    }
    if (drop === null || save <= 0) {
      return shelf <= 3
        ? { tone: 'buy', title: 'Buy now', detail: 'Already at the lowest price, and it comes off the shelf for this route in ' + Math.max(0, shelf) + ' day' + (shelf === 1 ? '' : 's') + '.' }
        : { tone: 'steady', title: 'Nothing to wait for', detail: 'This is the lowest step the shop allows. Buy when you need it.' };
    }
    if (drop > shelf) {
      return { tone: 'buy', title: 'Buy now', detail: 'It leaves this route in ' + Math.max(0, shelf) + ' days, before the next drop in ' + drop + '. Waiting would lose it.' };
    }
    if (drop <= 3) {
      return { tone: 'wait', title: 'Worth waiting ' + drop + ' day' + (drop === 1 ? '' : 's'), detail: 'It steps down to ' + vnd(next) + ' (' + vnd(save) + ' less), with ' + (shelf - drop) + ' days of margin left after that.' };
    }
    return { tone: 'steady', title: 'Your call', detail: 'Next drop is in ' + drop + ' days, to ' + vnd(next) + '. Wait if you do not need it today.' };
  }

  function advisor(p) {
    if (!store.sellable(p)) return '';
    var a = advice(p);
    return '<div class="advisor advisor--' + a.tone + '">' +
      '<p class="advisor__kicker">Wait or buy?</p>' +
      '<p class="advisor__title">' + esc(a.title) + '</p>' +
      '<p class="advisor__body">' + esc(a.detail) + '</p></div>';
  }

  /* ================================================ store map (shop) */

  function storeList() {
    var seen = {}, out = [];
    CS.PRODUCTS.forEach(function (p) {
      if (!seen[p.store]) { seen[p.store] = { name: p.store, km: p.km, items: 0 }; out.push(seen[p.store]); }
      if (store.sellable(p)) seen[p.store].items++;
    });
    return out;
  }

  function mapBlock() {
    var W = 460, H = 270, cx = W / 2, cy = H / 2 + 4, R = 24;
    var stores = storeList();
    var rings = [1, 2, 3, 4, 5].map(function (k) {
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (k * R) + '" fill="none" stroke="#CFE0D7" stroke-dasharray="3 4"/>' +
        '<text x="' + (cx + k * R + 2) + '" y="' + (cy - 3) + '" font-size="9" fill="#72837A">' + k + 'km</text>';
    }).join('');
    var dots = stores.map(function (s, i) {
      var a = (i * 137.5 + 20) * Math.PI / 180, r = s.km * R;
      var x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      var inRange = s.km <= S.maxKm, on = S.store === s.name;
      var anchor = x > cx ? 'start' : 'end', tx = x + (x > cx ? 12 : -12);
      return '<g class="mapdot' + (on ? ' is-on' : '') + (inRange ? '' : ' is-far') + '" data-store="' + esc(s.name) + '" tabindex="0" role="button" aria-label="' + esc(s.name) + ', ' + s.km + ' km, ' + s.items + ' items">' +
        '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (on ? 10 : 8) + '"/>' +
        '<text x="' + tx.toFixed(1) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="' + anchor + '" font-size="10">' + esc(s.name.replace(/^(Minimart|Co\.opmart|Tạp hoá|Hasaki|Guardian) /, '$1 ').slice(0, 22)) + '</text></g>';
    }).join('');

    return '<div class="mapblock"><div class="mapblock__ctl">' +
      '<label for="maxKm"><b>Within <span id="maxKmVal">' + S.maxKm + '</span> km</b> of you</label>' +
      '<input type="range" id="maxKm" min="1" max="5" step="0.5" value="' + S.maxKm + '" style="--pct:' + ((S.maxKm - 1) / 4 * 100) + '%" aria-label="Maximum distance in kilometres">' +
      '<p class="note">' + (S.store ? 'Showing ' + esc(S.store) + ' only. Tap it again to clear.' : 'Tap a shop on the map to see only its shelf.') + '</p>' +
      '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Map of shops around you" class="mapblock__svg">' +
      rings + '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#0E4A7B" stroke="#fff" stroke-width="2"/>' +
      '<text x="' + cx + '" y="' + (cy + 18) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#0E4A7B">You</text>' +
      dots + '</svg></div>';
  }

  /* ========================================================= seller */

  function sellerView() {
    var rows = db.table('products');
    var pid = S.sellerPid || rows[0].id;
    var r = db.row('products', pid) || rows[0];
    var p = store.byId(r.id);
    var sellerRow = db.table('sellers').filter(function (s) { return s.id === r.sellerId; })[0] || { name: '' };

    return '<div class="view"><div class="shell" style="padding-block:var(--sp-8) var(--sp-10)">' +
      '<p class="eyebrow">Seller console</p>' +
      '<h2 class="headline" style="font-size:var(--t-xl);margin:6px 0 8px">Set your floor, see the price move</h2>' +
      '<p class="note" style="margin-bottom:20px">Edits are written to the demo database and flow straight into the storefront. The floor and the deepest cut are the two numbers the platform is never allowed to go past.</p>' +

      '<div class="seg sellerpick" id="sellerPick" style="flex-wrap:wrap;border-radius:var(--r-sm)">' +
      rows.map(function (x) {
        return '<button data-seller-pick="' + x.id + '" aria-pressed="' + (x.id === r.id) + '">' + esc(store.shortName(x)) + '</button>';
      }).join('') + '</div>' +

      '<div class="sellergrid">' +
      '<div class="panel" style="margin-top:0"><h3>' + esc(r.name) + '</h3>' +
      '<p class="note" style="margin-bottom:14px">' + esc(sellerRow.name) + ' &middot; listed with ' + r.left0 + ' days of life &middot; updated ' + new Date(r.updatedAt).toLocaleString('en-GB') + '</p>' +
      '<div class="fields" id="sellerForm" data-pid="' + r.id + '">' +
      '<div class="field"><label for="sfBase">Shelf price (₫)</label><input id="sfBase" type="number" min="1000" step="500" value="' + r.base + '"></div>' +
      '<div class="field"><label for="sfStock">Stock (units)</label><input id="sfStock" type="number" min="0" max="999" value="' + r.stock + '"></div>' +
      '<div class="field"><label for="sfFloor">Floor (% of shelf price)</label><input id="sfFloor" type="number" min="5" max="95" value="' + r.floorPct + '"></div>' +
      '<div class="field"><label for="sfCut">Deepest cut allowed (%)</label><input id="sfCut" type="number" min="5" max="90" value="' + r.maxCut + '"></div>' +
      '</div>' +
      '<p class="note" id="sellerRead" style="margin-top:14px"></p>' +
      '<div class="actions"><button class="btn btn--primary" id="sellerSave">Save to database</button>' +
      '<a class="btn btn--quiet" href="#/p/' + r.id + '">View in shop</a></div></div>' +

      '<div class="panel" style="margin-top:0"><h3>How the price comes down</h3>' +
      '<div id="sellerChart">' + (p ? ui.priceChart(p) : '') + '</div>' +
      '<div class="legend"><span><i style="background:#0B6B42"></i>Selling price</span><span><i style="background:#CC3A47"></i>Your floor</span></div></div>' +
      '</div>' +

      '<p class="note" style="margin-top:20px">Reading this table from your own code: <code>CS.api.get(\'/products\')</code>. Writing: <code>CS.api.patch(\'/products/' + r.id + '\', {floorPct: 40})</code>. See the Database page.</p>' +
      '</div></div>';
  }

  function sellerPreview() {
    var form = document.getElementById('sellerForm');
    if (!form) return;
    var p = store.byId(form.dataset.pid);
    var g = function (id) { return +document.getElementById(id).value; };
    var tmp = {};
    Object.keys(p).forEach(function (k) { tmp[k] = p[k]; });
    tmp.base = Math.max(1000, g('sfBase')); tmp.floorPct = Math.min(95, Math.max(5, g('sfFloor'))); tmp.maxCut = Math.min(90, Math.max(5, g('sfCut')));
    document.getElementById('sellerChart').innerHTML = ui.priceChart(tmp);
    var left = store.daysLeft(tmp);
    document.getElementById('sellerRead').innerHTML =
      'Floor price <b>' + vnd(P.floorPrice(tmp)) + '</b> &middot; today (day +' + S.day + ') it sells at <b>' + vnd(P.priceAt(tmp, left)) +
      '</b> (&minus;' + P.discountPct(tmp, left) + '%).';
  }

  /* ===================================================== db inspector */

  function tableHtml(name, cols, limit) {
    var rows = db.table(name).slice(0, limit || 8);
    return '<div class="panel dbtable"><h3>' + name + ' <span class="pill">' + db.table(name).length + ' rows</span></h3>' +
      '<div class="dbscroll"><table><thead><tr>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') +
      '</tr></thead><tbody>' + (rows.length ? rows.map(function (r) {
        return '<tr>' + cols.map(function (c) {
          var v = r[c];
          if (c === 'at' || c === 'updatedAt') v = new Date(v).toLocaleString('en-GB');
          else if (Array.isArray(v)) v = v.length + ' line' + (v.length === 1 ? '' : 's');
          return '<td>' + esc(v === undefined ? '' : String(v)) + '</td>';
        }).join('') + '</tr>';
      }).join('') : '<tr><td colspan="' + cols.length + '" class="note">Empty. Place an order to add a row.</td></tr>') +
      '</tbody></table></div></div>';
  }

  function dbView() {
    var routes = ['GET /products', 'GET /products/p1', 'GET /sellers', 'GET /orders', 'GET /events', 'GET /stats'];
    return '<div class="view"><div class="shell" style="padding-block:var(--sp-8) var(--sp-10)">' +
      '<p class="eyebrow">Demo backend</p>' +
      '<h2 class="headline" style="font-size:var(--t-xl);margin:6px 0 8px">The database behind the shop</h2>' +
      '<p class="note" style="margin-bottom:20px">No server runs here. Four tables live in this browser (localStorage), and <code>CS.api</code> answers REST-style calls asynchronously, so the front end is already written for a real backend. Seller edits and orders write to these tables; stock, floors and counters read from them.</p>' +

      '<div class="panel" style="margin-top:0"><h3>Try the API</h3>' +
      '<div class="apibar"><select id="apiRoute" aria-label="Route">' + routes.map(function (r) { return '<option>' + r + '</option>'; }).join('') + '</select>' +
      '<button class="btn btn--primary btn--sm" id="apiSend">Send</button>' +
      '<button class="btn btn--quiet btn--sm" id="dbExport">Download JSON</button>' +
      '<button class="btn btn--quiet btn--sm" id="dbReset">Reset database</button></div>' +
      '<pre class="apiout" id="apiOut" aria-live="polite">Pick a route and press Send.</pre></div>' +

      tableHtml('products', ['id', 'name', 'base', 'floorPct', 'maxCut', 'stock', 'updatedAt'], 12) +
      tableHtml('sellers', ['id', 'name', 'km']) +
      tableHtml('orders', ['code', 'at', 'mode', 'units', 'total', 'items']) +
      tableHtml('events', ['id', 'at', 'type', 'table', 'ref', 'detail'], 12) +
      '</div></div>';
  }

  /* ============================================================ wiring */

  function init(h) {
    host = h;
    var app = document.getElementById('app');

    app.addEventListener('input', function (e) {
      if (e.target.id === 'maxKm') {
        document.getElementById('maxKmVal').textContent = e.target.value;
        e.target.style.setProperty('--pct', ((e.target.value - 1) / 4 * 100) + '%');
      }
      if (e.target.closest && e.target.closest('#sellerForm')) sellerPreview();
    });

    app.addEventListener('change', function (e) {
      if (e.target.id === 'maxKm') { S.maxKm = +e.target.value; host.render(); }
    });

    app.addEventListener('keydown', function (e) {
      var g = e.target.closest && e.target.closest('[data-store]');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
    });

    app.addEventListener('click', function (e) {
      var hit;
      if ((hit = e.target.closest('[data-store]'))) {
        var name = hit.getAttribute('data-store');
        S.store = S.store === name ? '' : name;
        host.render();
        return;
      }
      if ((hit = e.target.closest('[data-seller-pick]'))) {
        S.sellerPid = hit.getAttribute('data-seller-pick');
        host.refresh(); sellerPreview();
        return;
      }
      if (e.target.closest('#sellerSave')) {
        var form = document.getElementById('sellerForm'), g = function (id) { return document.getElementById(id).value; };
        CS.api.patch('/products/' + form.dataset.pid, {
          base: g('sfBase'), stock: g('sfStock'), floorPct: g('sfFloor'), maxCut: g('sfCut')
        }).then(function (res) {
          host.toast(res.status === 200 ? 'Saved to the database' : res.error, res.status === 200 ? '' : 'bad');
          host.refresh(); sellerPreview();
        });
        return;
      }
      if (e.target.closest('#apiSend')) {
        var parts = document.getElementById('apiRoute').value.split(' '), out = document.getElementById('apiOut');
        out.textContent = '…';
        CS.api.get(parts[1]).then(function (res) { out.textContent = JSON.stringify(res, null, 2); });
        return;
      }
      if (e.target.closest('#dbExport')) {
        var blob = new Blob([db.exportJson()], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'cirspecs-demo-db.json';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
        return;
      }
      if (e.target.closest('#dbReset')) {
        CS.api.post('/reset').then(function () { host.toast('Database reset to the seed data'); host.refresh(); });
      }
    });
  }

  CS.views = {
    init: init,
    impactBand: impactBand, alertsBand: alertsBand, savedNote: savedNote,
    advisor: advisor, mapBlock: mapBlock,
    sellerView: sellerView, sellerPreview: sellerPreview, dbView: dbView
  };

})(window.CS);
