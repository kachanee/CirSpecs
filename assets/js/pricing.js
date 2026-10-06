/* ===========================================================================
   CirSpecs — the pricing engine
   The whole proposition lives in this file: a markdown ladder that steps the
   price down as the days run out, bounded by a floor the shop sets itself,
   and a delisting threshold that differs by category and by route.
   Pure functions only. Nothing here reads state or touches the DOM.
   =========================================================================== */

window.CS = window.CS || {};

(function (CS) {
  'use strict';

  /* The ladder: discount as a function of days of life left. Five steps, so a
     shopper can see the next drop coming rather than watching a sliding number. */
  var STEPS = [90, 45, 30, 15, 7];

  function ladder(daysLeft) {
    if (daysLeft >= 90) return 20;
    if (daysLeft >= 45) return 30;
    if (daysLeft >= 30) return 40;
    if (daysLeft >= 15) return 50;
    if (daysLeft >= 7)  return 60;
    return 65;
  }

  /* The shop's floor, rounded to the nearest 500 dong like a real shelf price. */
  function floorPrice(p) {
    return Math.round(p.base * p.floorPct / 100 / 500) * 500;
  }

  /* Selling price at a given number of days left. The ladder is capped by the
     deepest discount the shop allows, then clamped to the floor. */
  function priceAt(p, daysLeft) {
    var cut = Math.min(ladder(daysLeft), p.maxCut);
    var stepped = Math.round(p.base * (1 - cut / 100) / 500) * 500;
    return Math.max(stepped, floorPrice(p));
  }

  function discountPct(p, daysLeft) {
    return Math.round((1 - priceAt(p, daysLeft) / p.base) * 100);
  }

  function atFloor(p, daysLeft) {
    return priceAt(p, daysLeft) <= floorPrice(p);
  }

  /* Days until the price steps down again, or null once it is on the last step. */
  function nextDrop(daysLeft) {
    for (var i = 0; i < STEPS.length; i++) {
      if (daysLeft > STEPS[i]) return daysLeft - STEPS[i];
    }
    return null;
  }

  /* How comfortable the remaining life is, relative to the route's threshold. */
  function freshness(daysLeft, group, mode) {
    var threshold = CS.FLOORS[group][mode];
    if (daysLeft > threshold + 25) return { label:'Plenty of time', pill:'pill--ok',     colour:'var(--brand)' };
    if (daysLeft > threshold + 7)  return { label:'Going soon',     pill:'pill--warn',   colour:'var(--warn)' };
    return                                { label:'Final days',    pill:'pill--danger', colour:'var(--price)' };
  }

  /* An item is sellable on a route only while it clears that route's threshold. */
  function sellable(p, daysLeft, mode) {
    return daysLeft >= CS.FLOORS[p.group][mode];
  }

  /* Donations always travel on the same-day collection route. */
  function donatable(p, daysLeft) {
    return daysLeft >= CS.FLOORS[p.group].pickup;
  }

  /* How full the life bar is drawn: days left against the life it was listed with. */
  function lifeRatio(p, daysLeft) {
    return Math.max(0, Math.min(100, daysLeft / (p.left0 + 10) * 100));
  }

  CS.pricing = {
    STEPS: STEPS,
    ladder: ladder,
    floorPrice: floorPrice,
    priceAt: priceAt,
    discountPct: discountPct,
    atFloor: atFloor,
    nextDrop: nextDrop,
    freshness: freshness,
    sellable: sellable,
    donatable: donatable,
    lifeRatio: lifeRatio
  };

})(window.CS);
