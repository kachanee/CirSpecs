/* ===========================================================================
   CirSpecs — views, router, wiring
   A hash router over six views. Every view is a pure string build; the only
   mutations live in the delegated handlers at the bottom of the file.
   =========================================================================== */

window.CS = window.CS || {};

(function (CS) {
  'use strict';

  var P = CS.pricing, S = CS.state, store = CS.store, ui = CS.ui;
  var esc = ui.esc, vnd = ui.vnd, icon = ui.icon, card = ui.card;

  var $ = function (id) { return document.getElementById(id); };

  /* ======================================================= chrome helpers */

  var toastTimer;
  function toast(message, tone) {
    var el = $('toast');
    var mark = tone === 'bad'
      ? icon('close', 16, '#FF9A94')
      : icon('check', 16, '#FFD400');
    el.innerHTML = mark + '<span>' + message + '</span>';
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2600);
  }

  function badges() {
    var basket = store.basketCount();
    var saved = Object.keys(S.fav).length;
    ['cartCount', 'tabCartCount'].forEach(function (id) {
      var el = $(id); if (!el) return;
      el.textContent = basket; el.hidden = !basket;
    });
    ['favCount', 'tabFavCount'].forEach(function (id) {
      var el = $(id); if (!el) return;
      el.textContent = saved; el.hidden = !saved;
    });
  }

  function paintRange(el) {
    el.style.setProperty('--pct', ((el.value - el.min) / (el.max - el.min)) * 100 + '%');
  }

  /* ============================================================ home view */

  function heroMosaic() {
    var open = CS.PRODUCTS.filter(store.sellable);
    var deal = open.filter(function (p) { return p.group === 'single'; })[0] || open[0] || CS.PRODUCTS[0];
    var left = store.daysLeft(deal);
    var price = P.priceAt(deal, left);
    var shops = CS.PRODUCTS.map(function (p) { return p.store; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).length;

    return '<div class="mosaic">' +

      '<section class="tile tile--hero tile--photo" style="--c:8;--r:3">' +
        '<img class="tile__img" onerror="this.remove()" src="' + CS.SCENES.shelf + '" alt="" fetchpriority="high">' +
        '<div>' +
          '<p class="tile__kicker">Near its date &middot; never past it</p>' +
          '<h1 class="tile__title">Still good.<em>Priced differently.</em></h1>' +
          '<p class="tile__body">Genuine branded stock close to its date, sold off at a price the shop sets itself. ' +
            'The price falls with every day that passes, and stops at the floor.</p>' +
          '<div class="heroActs">' +
            '<a class="btn btn--sun" href="#shop">Shop what is reduced</a>' +
            '<a class="btn btn--onDark" href="#pricing">How the price falls</a>' +
          '</div>' +
          '<ul class="heroTrust">' +
            '<li>' + icon('shield', 17, '#FFD400') + ' Seller verified</li>' +
            '<li>' + icon('clock', 17, '#FFD400') + ' Days left shown upfront</li>' +
            '<li>' + icon('refresh', 17, '#FFD400') + ' Refund within 24 hours</li>' +
          '</ul>' +
        '</div>' +
      '</section>' +

      '<a class="tile tile--sun tile--statement" href="#shop" style="--c:4;--r:1.5">' +
        '<div class="tile__cap"><div>' +
          '<p class="tile__kicker">Open now</p>' +
          '<p class="tile__title">Go shopping</p>' +
          '<p class="tile__body">' + open.length + ' lines reduced today, across ' + shops + ' shops near you.</p>' +
        '</div>' + '<span class="disc disc--ink">' + icon('arrow', 20) + '</span></div>' +
      '</a>' +

      '<section class="tile tile--brick" style="--c:4;--r:1.5">' +
        '<div class="livedeal">' +
          '<div class="livedeal__head"><span>Live price</span><b>day +' + S.day + '</b></div>' +
          '<div class="livedeal__row">' +
            '<div class="livedeal__shot">' + ui.packshot(deal) + '</div>' +
            '<div style="flex:1;min-width:0">' +
              '<p class="livedeal__name">' + esc(deal.name) + '</p>' +
              '<p class="livedeal__meta">' + left + ' days left &middot; ' + esc(deal.store) + '</p>' +
              '<p class="livedeal__price"><b>' + vnd(price) + '</b><s>' + vnd(deal.base) + '</s></p>' +
            '</div>' +
          '</div>' +
          '<div class="meter meter--onDark"><i style="width:' + P.lifeRatio(deal, left) + '%;background:#FFD400"></i></div>' +
          '<p class="livedeal__foot">' + (P.atFloor(deal, left)
            ? 'It has reached the floor the shop set. The system is not allowed to go lower.'
            : 'Press play on the blue bar above to watch the price fall day by day.') + '</p>' +
        '</div>' +
      '</section>' +

    '</div>';
  }

  function recommendationBand() {
    var profile = store.activeProfile();
    var hasOwn = Object.keys(store.realHistory()).length > 0;
    var recs = store.recommend();

    var tabs = (hasOwn ? [['mine', 'My activity']] : [])
      .concat(Object.keys(CS.PROFILES).map(function (k) { return [k, CS.PROFILES[k].label]; }));

    return '<section class="band band--paper" id="foryou"><div class="shell">' +
      '<div class="opener">' +
        '<p class="eyebrow">Picked for you <span class="pill pill--ai" style="margin-left:6px">AI</span></p>' +
        '<h2>Things you are likely to want next</h2>' +
        '<p>' + (profile === 'mine'
          ? 'Based on what you have bought, carted and saved in this browser.'
          : 'Nothing bought yet, so this is a sample shopper. Switch profile to see how the picks change with purchase history.') + '</p>' +
      '</div>' +
      '<div class="tools" style="border-top:0;padding-top:0">' +
        '<div class="seg" id="segProfile">' + tabs.map(function (t) {
          return '<button data-profile="' + t[0] + '" aria-pressed="' + (t[0] === profile) + '">' + t[1] + '</button>';
        }).join('') + '</div>' +
        (profile !== 'mine'
          ? '<span class="tools__count">History: ' + CS.PROFILES[profile].hist.map(function (id) {
              return esc(store.shortName(store.byId(id)));
            }).join(', ') + '</span>'
          : '') +
      '</div>' +
      (recs.length
        ? '<div class="grid grid--4">' + recs.map(function (r) {
            return '<div class="rec">' + card(r.p) +
              '<p class="rec__why"><b>' + r.match + '% match</b> &middot; ' + esc(r.why) + '</p></div>';
          }).join('') + '</div>'
        : '<div class="empty"><h3>Nothing to suggest right now</h3><p>Wind the clock back, or switch route to collection.</p></div>') +
      '<p class="note" style="margin-top:20px">Prototype note: the picks come from simple scoring rules (same aisle, bought together, how close to the date), not a trained model. Your history never leaves this browser.</p>' +
    '</div></section>';
  }

  function shopBand() {
    var list = store.visibleProducts();
    return '<section class="band" id="shop"><div class="shell">' +
      '<div class="opener">' +
        '<p class="eyebrow">The reduced shelf</p>' +
        '<h2>Available near you</h2>' +
        '<p>Every item states how many days are left and why it is discounted. Most of it is nowhere near spoiling: it was over-ordered, or the packaging changed.</p>' +
      '</div>' +
      '<div class="tools">' +
        '<div class="seg" id="segMode">' +
          '<button data-mode="pickup" aria-pressed="' + (S.mode === 'pickup') + '">Same-day collection</button>' +
          '<button data-mode="delivery" aria-pressed="' + (S.mode === 'delivery') + '">Delivery</button>' +
        '</div>' +
        '<span class="tools__count">' + list.length + ' item' + (list.length === 1 ? '' : 's') +
          (S.cat !== 'All' ? ' in ' + esc(S.cat) : '') + '</span>' +
        '<label class="field-inline"><span>Sort</span>' +
          '<select id="sortBy" aria-label="Sort the list">' +
            ['rec,Recommended', 'cut,Biggest discount', 'lo,Price: low to high', 'hi,Price: high to low', 'exp,Closest to date']
              .map(function (o) {
                var parts = o.split(',');
                return '<option value="' + parts[0] + '"' + (S.sort === parts[0] ? ' selected' : '') + '>' + parts[1] + '</option>';
              }).join('') +
          '</select></label>' +
      '</div>' +
      (list.length
        ? '<div class="grid">' + list.map(card).join('') + '</div>'
        : '<div class="empty">' + icon('search', 44, '#DBD4C8') +
          '<h3>Nothing matched</h3><p>Try a different word, or pick another category from the row above.</p></div>') +
    '</div></section>';
  }

  function pricingBand() {
    return '<section class="band band--paper" id="pricing"><div class="shell">' +
      '<div class="opener">' +
        '<p class="eyebrow">How the price is set</p>' +
        '<h2>It falls by the day, but never past the floor</h2>' +
        '<p>The shop sets two numbers: the lowest price it will accept, and the deepest discount it allows. The system may only move between them, so a brand is never undercut below the line its seller drew.</p>' +
      '</div>' +
    '</div>' +

    '<div class="shell" style="padding:0"><div class="mosaic">' +
      '<section class="tile tile--sun tile--statement" style="--c:7;--r:2">' +
        '<div class="tile__cap"><div>' +
          '<p class="tile__kicker">Five steps, one floor</p>' +
          '<p class="tile__title">20% at ninety days.<br>65% at the last week.<br>Then it stops.</p>' +
        '</div></div>' +
      '</section>' +
      '<section class="tile tile--photo" style="--c:5;--r:2">' +
        '<img class="tile__img" onerror="this.remove()" src="' + CS.SCENES.shopkeep + '" alt="">' +
        '<div class="tile__cap"><div>' +
          '<p class="tile__kicker">Who sets it</p>' +
          '<p class="tile__title">The shop, not the platform</p>' +
          '<p class="tile__body">Each seller enters its own floor price and its own cap on the discount.</p>' +
        '</div></div>' +
      '</section>' +
    '</div></div>' +

    '<div class="shell" style="margin-top:var(--gutter)">' +
      '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:var(--gutter)">' +
        '<div class="ladder">' +
          '<h3 style="font-size:var(--t-base);margin-bottom:10px">The markdown ladder</h3>' +
          ui.ladderChart() +
          '<div class="legend">' +
            '<span><i style="background:#0C5C3D"></i>Selling price by days left</span>' +
            '<span><i style="background:#C8102E"></i>Floor price</span>' +
          '</div>' +
        '</div>' +
        '<div class="ladder">' +
          '<h3 style="font-size:var(--t-base);margin-bottom:6px">Delisting thresholds by category</h3>' +
          '<p class="note" style="margin-bottom:14px">Not one figure for everything. The threshold follows how long a pack takes to use up, and how you collect it.</p>' +
          '<div class="thresholds">' +
            '<div class="thresholds__head"><span>Category group</span><span style="text-align:right">Collect</span><span style="text-align:right">Deliver</span></div>' +
            Object.keys(CS.FLOORS).map(function (k) {
              var f = CS.FLOORS[k];
              return '<div class="thresholds__row"><span>' + f.label + '</span>' +
                '<b style="color:var(--brand)">' + f.pickup + 'd</b><b>' + f.delivery + 'd</b></div>';
            }).join('') +
          '</div>' +
          '<p class="note" style="margin-top:14px">A bag of crisps with two days left is perfectly fine if you collect it this afternoon. The same bag shipped overnight is not. A jar of moisturiser works the other way round: thirty days is still tight, because the pack takes months to finish.</p>' +
        '</div>' +
      '</div>' +
    '</div></section>';
  }

  function donateBand() {
    var donated = store.donatedTotal();
    var picks = CS.PRODUCTS.filter(store.donatable)
      .sort(function (a, b) { return P.priceAt(a, store.daysLeft(a)) - P.priceAt(b, store.daysLeft(b)); })
      .slice(0, 4);

    return '<section class="band" id="donate">' +
      '<div class="shell" style="padding-inline:var(--shell-pad)"><div class="opener">' +
        '<p class="eyebrow">Buy for donation</p>' +
        '<h2>Not for you? Buy it for someone else</h2>' +
        '<p>Buy a near-date item at its reduced price and a partner food bank collects it the same day. The shop is paid, the food gets eaten, and you get a receipt for what you gave.</p>' +
      '</div></div>' +

      '<div class="shell" style="padding:0"><div class="mosaic">' +
        '<section class="tile tile--photo" style="--c:5;--r:2.2">' +
          '<img class="tile__img" onerror="this.remove()" src="' + CS.SCENES.volunteer + '" alt="Volunteers sorting donated groceries">' +
          '<div class="tile__cap"><div><p class="tile__kicker">Illustrative photo</p>' +
            '<p class="tile__title">Collected the same day</p></div></div>' +
        '</section>' +
        '<section class="tile tile--brand" style="--c:7;--r:2.2">' +
          '<div class="tile__cap"><div>' +
            '<p class="tile__kicker">Three steps</p>' +
            '<ul class="howsteps">' +
              '<li><i><span>1</span></i><span>Tap the gift button on any item, or choose <b>Buy for donation</b> on its page.</span></li>' +
              '<li><i><span>2</span></i><span>Pick the charity at checkout. Donations travel on the same-day route, so even short-dated stock qualifies.</span></li>' +
              '<li><i><span>3</span></i><span>The partner collects, and your order carries a donation receipt.</span></li>' +
            '</ul>' +
            '<div class="figures" style="margin-bottom:0">' +
              '<div class="figure" style="background:rgba(255,255,255,.12)"><b style="color:#FFD400">' + ui.num(donated) + '</b><span style="color:rgba(255,255,255,.75)">items donated</span></div>' +
              '<div class="figure" style="background:rgba(255,255,255,.12)"><b style="color:#FFD400">' + ui.num(donated * 2.5) + '</b><span style="color:rgba(255,255,255,.75)">meals and supplies</span></div>' +
              '<div class="figure" style="background:rgba(255,255,255,.12)"><b style="color:#FFD400">' + CS.PARTNERS.length + '</b><span style="color:rgba(255,255,255,.75)">partner charities</span></div>' +
            '</div>' +
          '</div></div>' +
        '</section>' +
      '</div></div>' +

      '<div class="shell" style="margin-top:var(--gutter)">' +
        '<div class="partners">' + CS.PARTNERS.map(function (x) {
          return '<article class="partner"><div class="partner__frame">' +
            '<img src="' + x.img + '" alt="" loading="lazy" onerror="this.remove()"></div>' +
            '<div class="partner__body"><b>' + esc(x.name) + ' &middot; ' + esc(x.area) + '</b>' +
            '<p>' + esc(x.serves) + '</p></div></article>';
        }).join('') + '</div>' +

        '<h3 style="font-size:var(--t-lg);margin:var(--sp-8) 0 var(--sp-5)">Good things to donate right now</h3>' +
        '<div class="grid grid--4">' + picks.map(card).join('') + '</div>' +
        '<p class="note" style="margin-top:20px">Demo only: the charities and the counters are made-up examples, and no real donation or payment is made.</p>' +
      '</div>' +
    '</section>';
  }

  function voicesBand() {
    return '<section class="band band--paper" id="voices"><div class="shell">' +
      '<div class="opener">' +
        '<p class="eyebrow">User research</p>' +
        '<h2>What the eight customer groups told us</h2>' +
        '<p>Illustrative responses built from the personas in the business plan, not quotations from real customers. Portraits are stock placeholders.</p>' +
      '</div>' +
      '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:var(--gutter)">' +
        CS.VOICES.map(ui.quoteCard).join('') +
      '</div>' +
    '</div></section>';
  }

  function viewHome() {
    return '<div class="view">' + heroMosaic() + recommendationBand() + shopBand() +
      pricingBand() + donateBand() + voicesBand() + '</div>';
  }

  /* ========================================================= product view */

  function viewProduct(id) {
    var p = store.byId(id);
    if (!p) return viewHome();

    var left = store.daysLeft(p);
    var threshold = CS.FLOORS[p.group][S.mode];
    var ok = left >= threshold;
    var price = P.priceAt(p, left);
    var cut = P.discountPct(p, left);
    var fr = P.freshness(left, p.group, S.mode);
    var tick = icon('check', 18, '#0C5C3D');
    var related = CS.PRODUCTS.filter(function (x) {
      return x.cat === p.cat && x.id !== p.id && store.sellable(x);
    }).slice(0, 4);
    var reviews = CS.REVIEWS[p.id] || [];

    return '<div class="view"><div class="shell">' +
      '<p class="crumbs"><a href="#/">Home</a> &rsaquo; <a href="#shop">' + esc(p.cat) + '</a> &rsaquo; ' + esc(p.name) + '</p>' +

      '<div class="detail">' +
        '<div>' +
          '<div class="gallery__main">' + ui.packshot(p) + '</div>' +
          '<div class="gallery__strip">' + [0, 1, 2].map(function (i) {
            return '<button aria-pressed="' + (i === 0) + '" aria-label="View ' + (i + 1) + '">' + ui.packshot(p) + '</button>';
          }).join('') + '</div>' +
        '</div>' +

        '<div>' +
          '<p class="eyebrow">' + esc(p.brand) + '</p>' +
          '<h1>' + esc(p.name) + '</h1>' +
          '<div class="detail__meta">' +
            '<span class="card__rate">' + ui.stars(p.rate) + '<b>' + p.rate.toFixed(1) + '</b> (' + p.revs + ' reviews)</span>' +
            '<span>' + icon('pin', 14) + '</span><span>' + esc(p.store) + ' &middot; ' + p.km + ' km</span>' +
          '</div>' +

          '<div class="panel">' +
            '<div class="pricebox__row"><b>' + vnd(price) + '</b><s>' + vnd(p.base) + '</s>' +
              '<span class="flash">&minus;' + cut + '%</span></div>' +
            '<p class="pricebox__save">You save ' + vnd(p.base - price) + '</p>' +
            '<div class="pills" style="margin-top:14px">' +
              '<span class="pill ' + fr.pill + '">' + fr.label + ' &middot; ' + left + ' days left</span>' +
              '<span class="pill">Seller verified</span>' +
              '<span class="pill pill--ai">&asymp; ' + (CS.CO2[p.group] / 1000).toFixed(1) + ' kg CO&#8322;e saved</span>' +
            '</div>' +

            (ok
              ? '<div class="actions">' +
                  '<div class="qty"><button data-qty="-" aria-label="One fewer">&minus;</button>' +
                  '<span id="qtyValue">1</span>' +
                  '<button data-qty="+" aria-label="One more">+</button></div>' +
                  '<button class="btn btn--primary" data-addqty="' + p.id + '">Add to cart</button>' +
                  '<button class="btn btn--outline" data-buynow="' + p.id + '">Buy now</button>' +
                '</div>'
              : '<p class="note" style="margin-top:16px">This item does not have enough life left for <b>' +
                (S.mode === 'pickup' ? 'collection' : 'delivery') + '</b> at this point in time. The threshold for this group is ' +
                CS.FLOORS[p.group].pickup + ' days when collecting and ' + CS.FLOORS[p.group].delivery + ' days when delivering.</p>') +

            (store.donatable(p)
              ? '<div class="giftbox"><div><b>Buy for donation</b>' +
                '<p>Pay the price above and a partner food bank collects this item today. Nothing is delivered to you.</p></div>' +
                '<button class="btn btn--quiet btn--sm" data-donateqty="' + p.id + '">' + icon('gift', 16) + ' Donate this</button></div>'
              : '') +

            '<ul class="facts">' +
              '<li>' + tick + '<span><b>Why it is here:</b> ' + esc(p.why) + '</span></li>' +
              '<li>' + tick + '<span>' + esc(p.desc) + '</span></li>' +
              '<li>' + tick + '<span>Up to ' + p.cap + ' units per customer, so the stock reaches more people.</span></li>' +
              '<li>' + tick + '<span>Not happy with it? Refund within 24 hours of collection.</span></li>' +
            '</ul>' +
          '</div>' +

          '<div class="panel">' +
            '<h3>How this price comes down</h3>' +
            '<p class="note" style="margin-bottom:12px">The green line is the selling price against days remaining. The red line is the floor the shop set, where it stops. The dot is where you are now; drag the time bar to move it.</p>' +
            ui.priceChart(p) +
            '<div class="legend"><span><i style="background:#0C5C3D"></i>Selling price</span>' +
            '<span><i style="background:#C8102E"></i>Shop floor price</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      (reviews.length
        ? '<section style="padding:var(--sp-8) 0 0"><h3 style="font-size:var(--t-lg);margin-bottom:var(--sp-4)">What buyers say</h3>' +
          '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:var(--gutter)">' +
          reviews.map(function (r) {
            return '<article class="quotecard"><div class="quotecard__head">' + ui.avatar(r) +
              '<div><p class="quotecard__name">' + esc(r.n) + '</p><p class="quotecard__role">' + esc(r.d) + '</p></div>' +
              '<span style="margin-left:auto;display:flex;gap:2px">' + ui.stars(5) + '</span></div>' +
              '<p class="quotecard__text">' + esc(r.t) + '</p></article>';
          }).join('') + '</div></section>'
        : '') +

      (related.length
        ? '<section style="padding:var(--sp-8) 0 var(--sp-10)"><h3 style="font-size:var(--t-lg);margin-bottom:var(--sp-5)">More in ' + esc(p.cat) + '</h3>' +
          '<div class="grid grid--4">' + related.map(card).join('') + '</div></section>'
        : '<div style="height:var(--sp-10)"></div>') +

    '</div></div>';
  }

  /* ======================================================== checkout view */

  function viewCheckout() {
    var t = store.totals();
    if (!t.units && !t.donUnits) {
      return '<div class="shell"><div class="empty">' + icon('bag', 44, '#DBD4C8') +
        '<h3>Nothing eligible in your basket</h3><p>Go back, pick a few items and try again.</p>' +
        '<a class="btn btn--primary" href="#/">Back to the shop</a></div></div>';
    }

    var partner = store.partnerOf(S.partner);
    var kept = t.units + t.donUnits;

    return '<div class="view"><div class="shell"><div class="checkout">' +
      '<div>' +
        '<div class="steps">' +
          '<div class="is-done"><i>01</i>Basket</div>' +
          '<div class="is-on"><i>02</i>Details</div>' +
          '<div><i>03</i>Confirm</div>' +
        '</div>' +

        '<div class="panel"><h3>Recipient</h3><div class="fields">' +
          '<div class="field"><label for="fName">Full name</label><input id="fName" placeholder="Nguyen Van A" autocomplete="name"></div>' +
          '<div class="field"><label for="fPhone">Phone number</label><input id="fPhone" placeholder="09xx xxx xxx" autocomplete="tel" inputmode="tel"></div>' +
        '</div></div>' +

        (t.donUnits
          ? '<div class="panel"><h3>Your donation</h3>' +
            '<p class="note" style="margin-bottom:14px">' + t.donUnits + ' item(s) go to the charity you choose. They are collected today, so nothing is delivered to you.</p>' +
            '<div class="field"><label for="partnerPick">Donate to</label><select id="partnerPick">' +
              CS.PARTNERS.map(function (x) {
                return '<option value="' + x.id + '"' + (x.id === S.partner ? ' selected' : '') + '>' + esc(x.name) + ' &middot; ' + esc(x.area) + '</option>';
              }).join('') + '</select></div>' +
            '<p class="note">' + esc(partner.serves) + '</p></div>'
          : '') +

        (t.units
          ? '<div class="panel"><h3>How you get it</h3>' +
            '<label class="choice' + (S.mode === 'pickup' ? ' is-on' : '') + '" data-route="pickup">' +
              '<input type="radio" name="route"' + (S.mode === 'pickup' ? ' checked' : '') + '>' +
              '<span><b>Collect at the shop &mdash; free</b><em>Held for you during the window you pick. This route also reaches the items with the fewest days left.</em></span></label>' +
            '<label class="choice' + (S.mode === 'delivery' ? ' is-on' : '') + '" data-route="delivery">' +
              '<input type="radio" name="route"' + (S.mode === 'delivery' ? ' checked' : '') + '>' +
              '<span><b>Delivery &mdash; ' + vnd(CS.SHIP_FEE) + ', free over ' + vnd(CS.FREE_SHIP) + '</b>' +
              '<em>Arrives within 24 hours. Some short-dated items are not available on this route.</em></span></label>' +
            (S.mode === 'pickup'
              ? '<div class="fields" style="margin-top:14px">' +
                '<div class="field"><label for="fPoint">Collection point</label><select id="fPoint">' +
                  '<option>Minimart An Phú &mdash; 1.2 km</option><option>Co.opmart Gò Vấp &mdash; 2.8 km</option>' +
                  '<option>Tạp hoá Bà Chiểu &mdash; 3.4 km</option></select></div>' +
                '<div class="field"><label for="fWindow">Time window</label><select id="fWindow">' +
                  '<option>Today 17:00 &ndash; 20:00</option><option>Today 12:00 &ndash; 14:00</option>' +
                  '<option>Tomorrow 09:00 &ndash; 12:00</option></select></div></div>'
              : '<div class="field" style="margin-top:14px"><label for="fAddr">Delivery address</label>' +
                '<input id="fAddr" placeholder="Street number, street, ward, district" autocomplete="street-address"></div>') +
            '</div>'
          : '') +

        '<div class="panel"><h3>Payment</h3>' +
          '<label class="choice is-on"><input type="radio" name="pay" checked>' +
            '<span><b>MoMo wallet</b><em>Paid as soon as you order.</em></span></label>' +
          '<label class="choice"><input type="radio" name="pay">' +
            '<span><b>VNPay</b><em>Domestic and international cards.</em></span></label>' +
          '<label class="choice"><input type="radio" name="pay">' +
            '<span><b>Cash on handover</b><em>Pay at collection, or when the courier arrives.</em></span></label>' +
          '<p class="note">This is a demo. No real payment is ever taken.</p>' +
        '</div>' +
      '</div>' +

      '<div class="aside"><div class="panel" style="margin-top:0"><h3>Your order</h3>' +
        store.cartLines().filter(function (l) { return l.ok; }).map(function (l) {
          return '<div class="lineitem" style="padding:10px 0"><div class="lineitem__shot" style="width:48px;height:48px;flex-basis:48px">' +
            ui.packshot(l.p) + '</div><div class="lineitem__main">' +
            '<p class="lineitem__name" style="font-size:var(--t-xs)">' + esc(l.p.name) + '</p>' +
            '<p class="lineitem__meta">&times;' + l.qty + ' &middot; ' + l.left + ' days left</p></div>' +
            '<span class="lineitem__price" style="font-size:var(--t-sm)">' + vnd(l.price * l.qty) + '</span></div>';
        }).join('') +
        (t.donUnits
          ? '<p class="grouphead">' + icon('gift', 13) + ' Donation</p>' +
            store.donLines().filter(function (l) { return l.ok; }).map(function (l) {
              return '<p class="orderline"><span>' + esc(l.p.name) + ' &times; ' + l.qty + '</span><b>' + vnd(l.price * l.qty) + '</b></p>';
            }).join('')
          : '') +
        '<div style="margin-top:14px">' +
          '<div class="sumrow"><span>Subtotal</span><b>' + vnd(t.sum) + '</b></div>' +
          (t.disc ? '<div class="sumrow"><span>Code ' + S.promo.code + '</span><b style="color:var(--brand)">&minus;' + vnd(t.disc) + '</b></div>' : '') +
          (t.units ? '<div class="sumrow"><span>' + (S.mode === 'pickup' ? 'Collection' : 'Delivery') + '</span><b>' + (t.ship ? vnd(t.ship) : 'Free') + '</b></div>' : '') +
          (t.donSum ? '<div class="sumrow"><span>Donated items (' + t.donUnits + ')</span><b>' + vnd(t.donSum) + '</b></div>' : '') +
          '<div class="sumrow sumrow--total"><span>Total</span><span>' + vnd(t.total) + '</span></div>' +
        '</div>' +
        (t.blocked
          ? '<p class="note" style="margin-top:10px">' + t.blocked + ' item(s) in your basket no longer have enough life left for this route, so they are left out of this order.</p>'
          : '') +
        '<button class="btn btn--primary btn--block" id="placeOrder" style="margin-top:16px">Place order</button>' +
        '<p class="note" style="text-align:center;margin-top:12px">You are saving ' + vnd(t.saved) +
          ' and keeping ' + kept + ' item' + (kept === 1 ? '' : 's') + ' out of the bin.</p>' +
      '</div></div>' +
    '</div></div></div>';
  }

  /* ========================================================= receipt view */

  function viewSuccess() {
    var o = S.orders[0];
    if (!o) {
      return '<div class="shell"><div class="empty"><h3>No orders yet</h3>' +
        '<a class="btn btn--primary" href="#/">Back to the shop</a></div></div>';
    }
    var heading = o.own === 0 ? 'Thank you for giving'
      : (o.mode === 'pickup' ? 'See you at the shop' : 'Your order is being prepared');
    var blurb = o.own === 0
      ? esc(o.partner || 'The charity') + ' collects your gift today. Keep this code as your donation receipt.'
      : (o.mode === 'pickup' ? 'Show this code to the staff when you collect.' : 'The courier will call before delivering.');

    return '<div class="view"><div class="shell"><div class="receipt">' +
      '<div class="receipt__tick">' + icon('check', 42, '#0C5C3D') + '</div>' +
      '<h2 class="headline" style="font-size:var(--t-xl)">' + heading + '</h2>' +
      '<p class="lede" style="margin:10px auto 0">' + blurb + '</p>' +
      '<p class="receipt__code">' + o.code + '</p>' +
      '<div class="pills" style="justify-content:center">' +
        '<span class="pill pill--ok">' + o.units + ' item' + (o.units === 1 ? '' : 's') + ' rescued</span>' +
        (o.donUnits ? '<span class="pill pill--gift">' + o.donUnits + ' donated</span>' : '') +
        '<span class="pill pill--ai">&asymp; ' + (o.co2 / 1000).toFixed(1) + ' kg CO&#8322;e</span>' +
        '<span class="pill">Saved ' + vnd(o.saved) + '</span>' +
      '</div>' +
      '<div class="ordercard" style="margin-top:26px">' +
        '<div class="ordercard__head"><b>Order detail</b>' +
        '<span class="meta">' + new Date(o.at).toLocaleString('en-GB') + '</span></div>' +
        o.items.map(ui.orderLine).join('') +
        (o.don && o.don.length
          ? '<p class="grouphead">' + icon('gift', 13) + ' Donated to ' + esc(o.partner || 'a partner charity') + '</p>' +
            o.don.map(ui.orderLine).join('')
          : '') +
        '<div class="sumrow sumrow--total"><span>Total</span><span>' + vnd(o.total) + '</span></div>' +
      '</div>' +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px">' +
        '<a class="btn btn--primary" href="#/">Keep shopping</a>' +
        '<a class="btn btn--outline" href="#/orders">View your orders</a>' +
      '</div>' +
    '</div></div></div>';
  }

  /* ========================================================== list views */

  function viewOrders() {
    return '<div class="view"><div class="shell shell--narrow" style="padding-block:var(--sp-8) var(--sp-10)">' +
      '<p class="eyebrow">Your account</p>' +
      '<h2 class="headline" style="font-size:var(--t-xl);margin:6px 0 8px">Your orders</h2>' +
      '<p class="note" style="margin-bottom:24px">Stored in this browser. Close the tab, come back, and they are still here.</p>' +
      (S.orders.length
        ? S.orders.map(function (o) {
            return '<div class="ordercard"><div class="ordercard__head">' +
              '<div><b style="color:var(--brand)">' + o.code + '</b>' +
              '<p class="meta">' + new Date(o.at).toLocaleString('en-GB') + ' &middot; ' +
              (o.mode === 'pickup' ? 'Collection' : 'Delivery') + '</p></div>' +
              '<span class="pill pill--ok">' + o.units + ' item' + (o.units === 1 ? '' : 's') + '</span></div>' +
              o.items.map(ui.orderLine).join('') +
              (o.don && o.don.length
                ? '<p class="grouphead">' + icon('gift', 13) + ' Donated to ' + esc(o.partner || 'a partner charity') + '</p>' +
                  o.don.map(ui.orderLine).join('')
                : '') +
              '<div class="sumrow sumrow--total"><span>Total</span><span>' + vnd(o.total) + '</span></div></div>';
          }).join('')
        : '<div class="empty">' + icon('receipt', 44, '#DBD4C8') +
          '<h3>No orders yet</h3><p>Place one and see how it is kept for you.</p>' +
          '<a class="btn btn--primary" href="#/">Start shopping</a></div>') +
    '</div></div>';
  }

  function viewSaved() {
    var ids = Object.keys(S.fav);
    var list = CS.PRODUCTS.filter(function (p) { return ids.indexOf(p.id) >= 0; });
    return '<div class="view"><div class="shell" style="padding-block:var(--sp-8) var(--sp-10)">' +
      '<p class="eyebrow">Your account</p>' +
      '<h2 class="headline" style="font-size:var(--t-xl);margin:6px 0 8px">Saved items</h2>' +
      '<p class="note" style="margin-bottom:24px">Prices here move with the clock, exactly as they do on the shop page.</p>' +
      (list.length
        ? '<div class="grid">' + list.map(card).join('') + '</div>'
        : '<div class="empty">' +
          '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#DBD4C8" stroke-width="1.5" aria-hidden="true">' + ui.PATHS.heart + '</svg>' +
          '<h3>Nothing saved yet</h3><p>Tap the heart on any item to keep it here.</p>' +
          '<a class="btn btn--primary" href="#/">See what is reduced</a></div>') +
    '</div></div>';
  }

  /* ============================================================== drawer */

  function openDrawer() {
    $('drawer').classList.add('is-open');
    $('scrim').classList.add('is-open');
    $('cartBtn').setAttribute('aria-expanded', 'true');
    drawDrawer();
    $('drawerClose').focus();
  }
  function closeDrawer() {
    $('drawer').classList.remove('is-open');
    $('scrim').classList.remove('is-open');
    $('cartBtn').setAttribute('aria-expanded', 'false');
  }
  function drawerOpen() { return $('drawer').classList.contains('is-open'); }

  function drawDrawer() {
    var lines = store.cartLines();
    var dons = store.donLines();
    var t = store.totals();

    $('drawerTitle').textContent = 'Your basket (' + store.basketCount() + ')';

    if (!lines.length && !dons.length) {
      $('drawerBody').innerHTML = '<div class="empty">' + icon('bag', 44, '#DBD4C8') +
        '<h3>Your basket is empty</h3><p>Pick a few things and come back.</p></div>';
      $('drawerFoot').innerHTML = '';
      return;
    }

    var remaining = CS.FREE_SHIP - t.sum;
    var shipNote = '';
    if (S.mode === 'delivery' && t.sum > 0) {
      shipNote = remaining > 0
        ? '<div class="shipbar"><p>Add ' + vnd(remaining) + ' more for free delivery</p>' +
          '<div class="meter"><i style="width:' + Math.min(100, t.sum / CS.FREE_SHIP * 100) + '%"></i></div></div>'
        : '<div class="shipbar"><p>This order qualifies for free delivery</p></div>';
    }

    $('drawerBody').innerHTML = shipNote +
      lines.map(function (l) { return ui.lineItem(l, 'cart'); }).join('') +
      (dons.length
        ? '<p class="grouphead">' + icon('gift', 13) + ' Donation items</p>' +
          dons.map(function (l) { return ui.lineItem(l, 'don'); }).join('')
        : '');

    $('drawerFoot').innerHTML =
      '<div class="promo"><input id="promoInput" placeholder="Promo code (try SAVE10)" aria-label="Promo code">' +
        '<button class="btn btn--quiet btn--sm" id="promoApply">Apply</button></div>' +
      '<div class="sumrow"><span>Original price</span><span style="text-decoration:line-through;color:var(--ink-3)">' + vnd(t.base) + '</span></div>' +
      '<div class="sumrow"><span>You save</span><b style="color:var(--brand)">&minus;' + vnd(t.base - t.sum - t.donSum) + '</b></div>' +
      (t.disc ? '<div class="sumrow"><span>Code ' + S.promo.code + '</span><b style="color:var(--brand)">&minus;' + vnd(t.disc) + '</b></div>' : '') +
      (t.ship ? '<div class="sumrow"><span>Delivery</span><b>' + vnd(t.ship) + '</b></div>' : '') +
      (t.donSum ? '<div class="sumrow"><span>Donated items (' + t.donUnits + ')</span><b>' + vnd(t.donSum) + '</b></div>' : '') +
      '<div class="sumrow sumrow--total"><span>Total</span><span>' + vnd(t.total) + '</span></div>' +
      (t.blocked ? '<p class="note" style="margin-top:8px">' + t.blocked + ' item(s) do not have enough life left for the selected route, so they are not counted.</p>' : '') +
      '<button class="btn btn--primary btn--block" id="toCheckout" style="margin-top:14px"' +
        ((t.units || t.donUnits) ? '' : ' disabled') + '>Proceed to checkout</button>';
  }

  /* ============================================================== router */

  function viewFor(hash) {
    if (hash.indexOf('#/p/') === 0) return viewProduct(hash.slice(4));
    if (hash === '#/checkout') return viewCheckout();
    if (hash === '#/success')  return viewSuccess();
    if (hash === '#/orders')   return viewOrders();
    if (hash === '#/saved')    return viewSaved();
    return viewHome();
  }

  var ANCHORS = /^#(shop|pricing|donate|foryou|voices)$/;

  function render() {
    $('dayLabel').textContent = '+' + S.day;
    if ((location.hash || '#/') === '#/success') return;   /* never redraw a receipt */
    $('app').innerHTML = viewFor(location.hash || '#/');
    wireView();
    if (drawerOpen()) drawDrawer();
    markTabs();
  }

  function route() {
    var hash = location.hash || '#/';
    $('app').innerHTML = viewFor(hash);
    wireView();
    markTabs();
    var anchor = ANCHORS.test(hash) ? document.getElementById(hash.slice(1)) : null;
    if (anchor) anchor.scrollIntoView();
    else window.scrollTo(0, 0);
  }

  function markTabs() {
    var hash = location.hash || '#/';
    Array.prototype.forEach.call(document.querySelectorAll('.tabbar a'), function (a) {
      if (a.getAttribute('href') === hash) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* ============================================================== wiring */

  function qtyValue() {
    var el = $('qtyValue');
    return el ? +el.textContent : 1;
  }

  function wireView() {
    var app = $('app');

    app.onclick = function (e) {
      var hit;

      if ((hit = e.target.closest('[data-fav]'))) {
        e.preventDefault(); e.stopPropagation();
        var on = store.toggleFav(hit.dataset.fav);
        badges(); toast(on ? 'Saved' : 'Removed from saved'); render();
        return;
      }
      if ((hit = e.target.closest('[data-add]'))) {
        e.preventDefault(); e.stopPropagation();
        store.addToCart(hit.dataset.add, 1);
        badges(); toast('Added to your basket');
        if (drawerOpen()) drawDrawer();
        return;
      }
      if ((hit = e.target.closest('[data-donate]'))) {
        e.preventDefault(); e.stopPropagation();
        if (store.addToDonation(hit.dataset.donate, 1)) {
          badges(); toast('Added as a donation');
          if (drawerOpen()) drawDrawer();
        } else toast('Too close to the date to donate', 'bad');
        return;
      }
      if ((hit = e.target.closest('[data-donateqty]'))) {
        if (store.addToDonation(hit.dataset.donateqty, qtyValue())) {
          badges(); openDrawer();
        } else toast('Too close to the date to donate', 'bad');
        return;
      }
      if ((hit = e.target.closest('[data-addqty]'))) {
        store.addToCart(hit.dataset.addqty, qtyValue());
        badges(); toast('Added to your basket');
        if (drawerOpen()) drawDrawer();
        return;
      }
      if ((hit = e.target.closest('[data-buynow]'))) {
        store.addToCart(hit.dataset.buynow, qtyValue());
        badges(); location.hash = '#/checkout';
        return;
      }
      if ((hit = e.target.closest('[data-qty]'))) {
        var el = $('qtyValue'), v = +el.textContent;
        el.textContent = hit.dataset.qty === '+' ? Math.min(12, v + 1) : Math.max(1, v - 1);
        return;
      }
      if ((hit = e.target.closest('[data-route]'))) {
        S.mode = hit.dataset.route; store.save(); render();
        return;
      }
      if (e.target.closest('#placeOrder')) {
        if (store.placeOrder()) { badges(); closeDrawer(); location.hash = '#/success'; }
        return;
      }
      if ((hit = e.target.closest('[data-open]'))) {
        location.hash = '#/p/' + hit.dataset.open;
        return;
      }
    };

    var modes = $('segMode');
    if (modes) modes.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      S.mode = b.dataset.mode; store.save(); render();
      toast(S.mode === 'pickup' ? 'Showing same-day collection stock' : 'Showing stock available for delivery');
    };

    var sortBy = $('sortBy');
    if (sortBy) sortBy.onchange = function () { S.sort = this.value; render(); };

    var profiles = $('segProfile');
    if (profiles) profiles.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      S.profile = b.dataset.profile; store.save(); render();
    };

    var partnerPick = $('partnerPick');
    if (partnerPick) partnerPick.onchange = function () { S.partner = this.value; store.save(); render(); };
  }

  function wireChrome() {
    $('cartBtn').onclick = openDrawer;
    $('tabCart').onclick = function (e) { e.preventDefault(); openDrawer(); };
    $('drawerClose').onclick = closeDrawer;
    $('scrim').onclick = closeDrawer;
    $('favBtn').onclick = function () { location.hash = '#/saved'; };
    $('ordersBtn').onclick = function () { location.hash = '#/orders'; };

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawerOpen()) closeDrawer();
    });

    /* Basket drawer: quantity steppers for both bags. */
    $('drawerBody').onclick = function (e) {
      var hit;
      if ((hit = e.target.closest('[data-dinc]'))) { store.bump(S.don, hit.dataset.dinc, 1); }
      else if ((hit = e.target.closest('[data-ddec]'))) { store.bump(S.don, hit.dataset.ddec, -1); }
      else if ((hit = e.target.closest('[data-ddel]'))) { store.drop(S.don, hit.dataset.ddel); }
      else if ((hit = e.target.closest('[data-inc]'))) { store.bump(S.cart, hit.dataset.inc, 1); }
      else if ((hit = e.target.closest('[data-dec]'))) { store.bump(S.cart, hit.dataset.dec, -1); }
      else if ((hit = e.target.closest('[data-del]'))) { store.drop(S.cart, hit.dataset.del); }
      else return;
      badges(); drawDrawer();
    };

    $('drawerFoot').onclick = function (e) {
      if (e.target.closest('#toCheckout')) { closeDrawer(); location.hash = '#/checkout'; return; }
      if (e.target.closest('#promoApply')) {
        var promo = store.applyPromo($('promoInput').value);
        toast(promo ? '10% code applied' : 'That code is not valid', promo ? '' : 'bad');
        drawDrawer();
      }
    };

    /* Search, debounced so the grid does not thrash on every keystroke. */
    var searchTimer;
    $('search').addEventListener('input', function () {
      var value = this.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        S.query = value;
        if ((location.hash || '#/') !== '#/') location.hash = '#/';
        else render();
      }, 220);
    });

    /* Category rail. */
    var rail = $('catrail');
    rail.innerHTML = store.categories().map(function (c) {
      return '<button data-cat="' + esc(c) + '" aria-pressed="' + (c === S.cat) + '">' + esc(c) + '</button>';
    }).join('');
    rail.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      S.cat = b.dataset.cat;
      Array.prototype.forEach.call(rail.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-pressed', String(x.dataset.cat === S.cat));
      });
      if ((location.hash || '#/') !== '#/') location.hash = '#/';
      else render();
    };

    /* The time machine. */
    var clock = $('clock'), ticker = null;
    clock.addEventListener('input', function () {
      S.day = +this.value; paintRange(this); render();
    });
    $('playBtn').addEventListener('click', function () {
      S.playing = !S.playing;
      this.innerHTML = ui.play(S.playing);
      this.setAttribute('aria-label', S.playing ? 'Pause the time simulation' : 'Run the time simulation');
      if (S.playing) {
        ticker = setInterval(function () {
          if (+clock.value >= +clock.max) { $('playBtn').click(); return; }
          clock.value = +clock.value + 1;
          S.day = +clock.value;
          paintRange(clock); render();
        }, 560);
      } else clearInterval(ticker);
    });

    window.addEventListener('hashchange', route);
  }

  /* ================================================================ boot */

  /* The masthead grows a row on narrow screens, so the sticky offset for the
     clock bar and for in-page anchors is measured rather than assumed. */
  function measureChrome() {
    var h = document.querySelector('.masthead').offsetHeight;
    var root = document.documentElement;
    root.style.setProperty('--masthead-h', h + 'px');
    root.style.setProperty('scroll-padding-top', (h + 120) + 'px');
  }

  function boot() {
    measureChrome();
    window.addEventListener('resize', measureChrome);
    wireChrome();
    paintRange($('clock'));
    badges();
    route();
    $('year').textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window.CS);
