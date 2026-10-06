/* ===========================================================================
   CirSpecs — presentation helpers
   String builders only: every function here returns HTML, none of them touch
   the document or the state beyond reading it.
   =========================================================================== */

window.CS = window.CS || {};

(function (CS) {
  'use strict';

  var P = CS.pricing;
  var S = CS.state;
  var store = CS.store;

  /* --- primitives --------------------------------------------------------- */

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function vnd(n) { return Math.round(n).toLocaleString('en-US') + ' ₫'; }

  function num(n) { return Math.round(n).toLocaleString('en-US'); }

  /* --- icons -------------------------------------------------------------- */

  var PATHS = {
    search:   '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    heart:    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    bag:      '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
    receipt:  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/>',
    arrow:    '<path d="M5 12h14M13 6l6 6-6 6"/>',
    close:    '<path d="M18 6 6 18M6 6l12 12"/>',
    check:    '<path d="M20 6 9 17l-5-5"/>',
    shield:   '<path d="M12 3 4 7v6c0 4.4 3.4 8.2 8 9 4.6-.8 8-4.6 8-9V7l-8-4Z"/><path d="m9 12 2 2 4-4"/>',
    clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    refresh:  '<path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/>',
    gift:     '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    leaf:     '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    pin:      '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    home:     '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>'
  };

  function icon(name, size, stroke) {
    return '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" ' +
      'fill="none" stroke="' + (stroke || 'currentColor') + '" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PATHS[name] + '</svg>';
  }

  function play(isPlaying) {
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      (isPlaying ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>' : '<path d="M8 5v14l11-7z"/>') + '</svg>';
  }

  function stars(rating) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="' +
        (i <= Math.round(rating) ? '#E8A700' : '#DBD4C8') +
        '"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z"/></svg>';
    }
    return out;
  }

  /* --- packshots ---------------------------------------------------------- */
  /* Products carry a photo URL. When it is blank, a flat vector pack stands in,
     so the catalogue never shows a broken frame.                             */

  function drawnPack(kind, c1, c2) {
    var uid = (kind + c1).replace(/[^a-z0-9]/gi, '');
    var fill = 'url(#a' + uid + ')', sheen = 'url(#s' + uid + ')';
    var defs =
      '<defs><linearGradient id="a' + uid + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>' +
      '<linearGradient id="s' + uid + '" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/>' +
      '</linearGradient></defs>';

    var SHAPES = {
      bottle: '<path d="M27 15h10v7l5 6v35a5 5 0 0 1-5 5H27a5 5 0 0 1-5-5V28l5-6v-7z" fill="' + fill + '"/>' +
        '<path d="M34 15h3v7l5 6v35a5 5 0 0 1-5 5h-3V15z" fill="' + sheen + '"/>' +
        '<rect x="22" y="38" width="20" height="15" rx="2" fill="#fff" opacity=".9"/>' +
        '<rect x="26" y="8" width="12" height="8" rx="2.5" fill="' + c2 + '"/>',
      carton: '<path d="M20 24h24v40a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V24z" fill="' + fill + '"/>' +
        '<path d="M20 24l12-11 12 11H20z" fill="' + c2 + '"/>' +
        '<path d="M36 24h8v40a4 4 0 0 1-4 4h-4V24z" fill="' + sheen + '"/>' +
        '<rect x="24" y="40" width="16" height="16" rx="2" fill="#fff" opacity=".92"/>',
      pouch: '<path d="M19 21h26l-2.6 45a4 4 0 0 1-4 3.8H25.6a4 4 0 0 1-4-3.8L19 21z" fill="' + fill + '"/>' +
        '<path d="M19 21h26l-.4 7H19.4L19 21z" fill="' + c2 + '"/>' +
        '<path d="M34 21h11l-2.6 45a4 4 0 0 1-4 3.8H34V21z" fill="' + sheen + '"/>' +
        '<ellipse cx="32" cy="46" rx="9.5" ry="9" fill="#fff" opacity=".9"/>',
      tin: '<ellipse cx="32" cy="25" rx="19" ry="6.5" fill="' + c2 + '"/>' +
        '<path d="M13 25v33c0 3.6 8.5 6.5 19 6.5s19-2.9 19-6.5V25" fill="' + fill + '"/>' +
        '<path d="M38 25.6V64c7.6-.8 13-3.2 13-6V25" fill="' + sheen + '"/>' +
        '<rect x="19" y="36" width="26" height="15" rx="2.5" fill="#fff" opacity=".92"/>',
      jar: '<rect x="19" y="27" width="26" height="31" rx="5" fill="' + fill + '"/>' +
        '<rect x="34" y="27" width="11" height="31" rx="5" fill="' + sheen + '"/>' +
        '<rect x="16" y="18" width="32" height="11" rx="3.5" fill="' + c2 + '"/>' +
        '<rect x="23" y="37" width="18" height="12" rx="2" fill="#fff" opacity=".92"/>',
      tube: '<path d="M25 21h14v38a7 7 0 0 1-14 0V21z" fill="' + fill + '"/>' +
        '<path d="M33 21h6v38a7 7 0 0 1-6 6.9V21z" fill="' + sheen + '"/>' +
        '<rect x="27" y="12" width="10" height="10" rx="2.5" fill="' + c2 + '"/>' +
        '<rect x="27" y="33" width="10" height="15" rx="1.5" fill="#fff" opacity=".9"/>',
      cup: '<path d="M21 25h22l-2.6 36a5 5 0 0 1-5 4.6h-6.8a5 5 0 0 1-5-4.6L21 25z" fill="' + fill + '"/>' +
        '<ellipse cx="32" cy="25" rx="11" ry="3.6" fill="' + c2 + '"/>' +
        '<path d="M34 25h9l-2.6 36a5 5 0 0 1-5 4.6H34V25z" fill="' + sheen + '"/>' +
        '<rect x="25" y="38" width="14" height="12" rx="2" fill="#fff" opacity=".9"/>',
      box: '<path d="M15 27l17-9 17 9v28l-17 9-17-9V27z" fill="' + fill + '"/>' +
        '<path d="M32 36l17-9v28l-17 9V36z" fill="' + sheen + '"/>' +
        '<path d="M15 27l17 9 17-9" stroke="' + c2 + '" stroke-width="2" fill="none"/>'
    };

    return '<svg viewBox="0 0 64 80" width="78%" height="78%" fill="none" aria-hidden="true">' + defs +
      '<ellipse cx="32" cy="72" rx="17" ry="3.4" fill="#131210" opacity=".08"/>' +
      (SHAPES[kind] || SHAPES.box) + '</svg>';
  }

  /* The vector pack sits underneath the photo. If the photo fails to load it
     removes itself and the drawing shows through, so no frame is ever blank. */
  function packshot(p) {
    var fallback = drawnPack(p.art, p.c1, p.c2);
    if (!p.img) return fallback;
    return '<span class="shot">' + fallback +
      '<img src="' + p.img + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.remove()">' +
      '</span>';
  }

  /* --- product card -------------------------------------------------------- */

  function card(p) {
    var left = store.daysLeft(p);
    var threshold = CS.FLOORS[p.group][S.mode];

    if (left < threshold) {
      var collectable = left >= CS.FLOORS[p.group].pickup && S.mode === 'delivery';
      return '<article class="card is-off">' +
        '<div class="card__shot">' + packshot(p) + '</div>' +
        '<div class="card__body">' +
          '<p class="card__name">' + esc(p.name) + '</p>' +
          '<p class="card__sub">' + esc(p.brand) + '</p>' +
          '<span class="pill">Not available now</span>' +
          '<p class="card__off">' + (collectable
            ? 'Not enough life left to deliver. Switch to <b>Collection</b> and you can still buy it.'
            : 'Under ' + threshold + ' days left, so it comes down automatically.') + '</p>' +
        '</div></article>';
    }

    var price = P.priceAt(p, left);
    var cut = P.discountPct(p, left);
    var fr = P.freshness(left, p.group, S.mode);
    var drop = P.nextDrop(left);
    var saved = !!S.fav[p.id];

    return '<article class="card">' +
      '<div class="card__shot" data-open="' + p.id + '">' + packshot(p) +
        '<span class="flash card__flash">&minus;' + cut + '%</span>' +
        '<button class="card__heart' + (saved ? ' is-on' : '') + '" data-fav="' + p.id + '" ' +
          'aria-label="' + (saved ? 'Remove from saved' : 'Save this item') + '" aria-pressed="' + saved + '">' +
          '<svg width="17" height="17" viewBox="0 0 24 24" fill="' + (saved ? 'currentColor' : 'none') +
          '" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          PATHS.heart + '</svg></button>' +
        '<div class="card__quick">' +
          '<button class="btn btn--primary btn--sm" style="flex:1" data-add="' + p.id + '">Add to cart</button>' +
          (store.donatable(p)
            ? '<button class="btn btn--quiet btn--sm" data-donate="' + p.id + '" aria-label="Buy for donation" title="Buy for donation">' + icon('gift', 16) + '</button>'
            : '') +
        '</div>' +
      '</div>' +
      '<div class="card__body" data-open="' + p.id + '">' +
        '<p class="card__price"><b>' + vnd(price) + '</b><s>' + vnd(p.base) + '</s></p>' +
        '<p class="card__name">' + esc(p.name) + '</p>' +
        '<p class="card__sub">' + esc(p.brand) + ' &middot; ' + esc(p.store) + '</p>' +
        '<p class="card__rate">' + stars(p.rate) + '<b>' + p.rate.toFixed(1) + '</b><span>(' + p.revs + ')</span></p>' +
        '<div class="meter"><i style="width:' + P.lifeRatio(p, left) + '%;background:' + fr.colour + '"></i></div>' +
        '<p class="card__life"><span style="color:' + fr.colour + ';font-weight:700">' + left + ' days left</span>' +
          '<span style="color:var(--ink-3)">' + (drop ? 'drops again in ' + drop + 'd' : 'lowest step') + '</span></p>' +
      '</div></article>';
  }

  /* --- charts -------------------------------------------------------------- */

  /* The price of one product against the days it has been on the shelf. */
  function priceChart(p) {
    var W = 460, H = 170, pad = { l:52, r:16, t:16, b:28 };
    var span = Math.max(1, p.left0 - CS.FLOORS[p.group].pickup);
    var pts = [], i;
    for (i = 0; i <= span; i++) pts.push({ d:i, v:P.priceAt(p, p.left0 - i) });

    var lo = Math.min.apply(null, pts.map(function (x) { return x.v; })) * 0.9;
    var hi = p.base * 1.04;
    var X = function (d) { return pad.l + d / span * (W - pad.l - pad.r); };
    var Y = function (v) { return pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b); };

    var line = pts.map(function (x, n) { return (n ? 'L' : 'M') + X(x.d).toFixed(1) + ' ' + Y(x.v).toFixed(1); }).join(' ');
    var area = line + ' L ' + X(span).toFixed(1) + ' ' + (H - pad.b) + ' L ' + X(0).toFixed(1) + ' ' + (H - pad.b) + ' Z';

    var floor = P.floorPrice(p);
    var now = Math.min(span, Math.max(0, S.day));
    var nowValue = P.priceAt(p, p.left0 - now);

    var gridlines = [lo, (lo + hi) / 2, hi].map(function (v) {
      return '<text x="' + (pad.l - 9) + '" y="' + (Y(v) + 3.5) + '" text-anchor="end" font-size="10" fill="#7E786F">' +
        Math.round(v / 1000) + 'k</text>' +
        '<line x1="' + pad.l + '" y1="' + Y(v) + '" x2="' + (W - pad.r) + '" y2="' + Y(v) + '" stroke="#EDE8DF"/>';
    }).join('');

    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" ' +
      'aria-label="Selling price falling from ' + vnd(p.base) + ' towards the floor of ' + vnd(floor) + '">' +
      '<defs><linearGradient id="fade' + p.id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#0C5C3D" stop-opacity=".22"/><stop offset="1" stop-color="#0C5C3D" stop-opacity="0"/>' +
      '</linearGradient></defs>' + gridlines +
      '<path d="' + area + '" fill="url(#fade' + p.id + ')"/>' +
      '<path d="' + line + '" fill="none" stroke="#0C5C3D" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<line x1="' + pad.l + '" y1="' + Y(floor) + '" x2="' + (W - pad.r) + '" y2="' + Y(floor) + '" stroke="#C8102E" stroke-width="1.6" stroke-dasharray="5 4"/>' +
      '<text x="' + (W - pad.r) + '" y="' + (Y(floor) - 6) + '" text-anchor="end" font-size="10" fill="#C8102E">floor ' + vnd(floor) + '</text>' +
      '<line x1="' + X(now) + '" y1="' + pad.t + '" x2="' + X(now) + '" y2="' + (H - pad.b) + '" stroke="#131210" stroke-dasharray="3 3" opacity=".4"/>' +
      '<circle cx="' + X(now) + '" cy="' + Y(nowValue) + '" r="6" fill="#0C5C3D" stroke="#fff" stroke-width="2.5"/>' +
      '<text x="' + pad.l + '" y="' + (H - 8) + '" font-size="10" fill="#7E786F">listed</text>' +
      '<text x="' + (W - pad.r) + '" y="' + (H - 8) + '" text-anchor="end" font-size="10" fill="#7E786F">+' + span + 'd &middot; delisted</text>' +
      '</svg>';
  }

  /* The ladder itself, drawn on a notional 100,000 dong item. */
  function ladderChart() {
    var W = 460, H = 180, pad = { l:46, r:16, t:18, b:28 };
    var base = 100000, floorPct = 42, pts = [], d;
    for (d = 110; d >= 1; d--) {
      pts.push({ d:d, v: Math.max(base * (1 - Math.min(P.ladder(d), 70) / 100), base * floorPct / 100) });
    }
    var X = function (day) { return pad.l + (110 - day) / 109 * (W - pad.l - pad.r); };
    var lo = base * 0.3, hi = base * 1.06;
    var Y = function (v) { return pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b); };
    var line = pts.map(function (x, i) { return (i ? 'L' : 'M') + X(x.d).toFixed(1) + ' ' + Y(x.v).toFixed(1); }).join(' ');

    var marks = P.STEPS.map(function (d2) {
      return '<line x1="' + X(d2) + '" y1="' + pad.t + '" x2="' + X(d2) + '" y2="' + (H - pad.b) + '" stroke="#EDE8DF"/>' +
        '<text x="' + X(d2) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="10" fill="#7E786F">' + d2 + 'd</text>';
    }).join('');

    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" ' +
      'aria-label="Discount ladder: the price steps down at 90, 45, 30, 15 and 7 days left, then holds at the floor">' +
      marks +
      '<path d="' + line + '" fill="none" stroke="#0C5C3D" stroke-width="2.8" stroke-linejoin="round"/>' +
      '<line x1="' + pad.l + '" y1="' + Y(base * floorPct / 100) + '" x2="' + (W - pad.r) + '" y2="' + Y(base * floorPct / 100) +
        '" stroke="#C8102E" stroke-width="1.6" stroke-dasharray="5 4"/>' +
      '<text x="' + (pad.l + 5) + '" y="' + (Y(base * floorPct / 100) - 6) + '" font-size="10" fill="#C8102E">shop floor price</text>' +
      '<text x="' + pad.l + '" y="' + (pad.t - 4) + '" font-size="10" fill="#7E786F">shelf price</text>' +
      '</svg>';
  }

  /* --- small blocks --------------------------------------------------------- */

  function avatar(person, size) {
    var initial = person.n.replace(/^(Mr|Ms) /, '').charAt(0);
    var style = 'background:' + person.c + (size ? ';width:' + size + 'px;height:' + size + 'px;flex-basis:' + size + 'px' : '');
    return '<span class="avatar" style="' + style + '" aria-hidden="true">' + initial +
      (person.img ? '<img src="' + person.img + '" alt="" loading="lazy" onerror="this.remove()">' : '') + '</span>';
  }

  function quoteCard(v) {
    return '<article class="quotecard">' +
      '<p class="quotecard__text">&ldquo;' + esc(v.q) + '&rdquo;</p>' +
      '<div class="quotecard__head">' + avatar(v) +
        '<div><p class="quotecard__name">' + esc(v.n) + '</p><p class="quotecard__role">' + esc(v.r) + '</p></div>' +
      '</div></article>';
  }

  function lineItem(l, bagKind) {
    var isDon = bagKind === 'don';
    var prefix = isDon ? 'd' : '';
    var meta = l.ok
      ? (isDon ? 'To ' + esc(store.partnerOf(S.partner).name) + ' &middot; ' + vnd(l.price)
               : l.left + ' days left &middot; ' + vnd(l.price))
      : (isDon ? 'Too close to the date to donate' : 'Not enough life left for this route');

    return '<div class="lineitem' + (l.ok ? '' : ' is-blocked') + '">' +
      '<div class="lineitem__shot">' + packshot(l.p) + '</div>' +
      '<div class="lineitem__main">' +
        '<p class="lineitem__name">' + esc(l.p.name) + '</p>' +
        '<p class="lineitem__meta">' + meta + '</p>' +
        '<div class="lineitem__row">' +
          '<span class="stepper">' +
            '<button data-' + prefix + 'dec="' + l.p.id + '" aria-label="One fewer">&minus;</button>' +
            '<span>' + l.qty + '</span>' +
            '<button data-' + prefix + 'inc="' + l.p.id + '" aria-label="One more">+</button>' +
          '</span>' +
          (l.ok
            ? '<span class="lineitem__price">' + vnd(l.price * l.qty) + '</span>'
            : '<button class="linkbtn" data-' + prefix + 'del="' + l.p.id + '">Remove</button>') +
        '</div>' +
      '</div></div>';
  }

  function orderLine(item) {
    return '<p class="orderline"><span>' + esc(item.name) + ' &times; ' + item.qty + '</span>' +
      '<b>' + vnd(item.price * item.qty) + '</b></p>';
  }

  CS.ui = {
    esc: esc, vnd: vnd, num: num,
    icon: icon, play: play, stars: stars, PATHS: PATHS,
    packshot: packshot, drawnPack: drawnPack,
    card: card, priceChart: priceChart, ladderChart: ladderChart,
    avatar: avatar, quoteCard: quoteCard, lineItem: lineItem, orderLine: orderLine
  };

})(window.CS);
