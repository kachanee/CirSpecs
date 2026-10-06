# CirSpecs

**Still good. Priced differently.**

A storefront for groceries that are close to their date but nowhere near spoiling.
The price falls on its own as the days run down, and stops at a floor the shop
sets for itself. Nothing is sold once it drops below the threshold for the route
you picked.

This repository is the front end only. There is no server and no real payment:
the catalogue is a JavaScript file and your basket lives in `localStorage`.

<p align="center"><em>Team 3R &middot; ISB Honours College, University of Economics Ho Chi Minh City</em></p>

---

## Run it

```bash
git clone https://github.com/kachanee/CirSpecs.git
cd CirSpecs
open index.html          # macOS; or xdg-open / just double-click the file
```

It works straight off the filesystem — no build step, no dependencies, no
`npm install`. Scripts are plain `<script>` tags rather than ES modules precisely
so that `file://` keeps working.

If you prefer a local server (needed only if you later add `fetch` calls):

```bash
python3 -m http.server 8000     # then visit http://localhost:8000
```

Product photography is loaded from Unsplash. Offline, each photo falls back to a
drawn vector packshot, so the catalogue never shows an empty frame.

---

## The idea

A minimart over-orders. A brand changes its packaging. Stock ends up in the back
room with two months of life left and no way to shift it, so it goes in the bin.

CirSpecs puts that stock on a public shelf and lets the clock do the pricing.

### The markdown ladder

Discount is a step function of the days of life left — five steps, so a shopper
can see the next drop coming instead of watching a number slide around.

| Days left | Discount |
|---|---|
| 90 or more | 20% |
| 45–89 | 30% |
| 30–44 | 40% |
| 15–29 | 50% |
| 7–14 | 60% |
| under 7 | 65% |

Two numbers from the seller bound it:

- **`floorPct`** — the lowest price the shop will accept, as a percentage of the
  shelf price. The ladder may never go below it.
- **`maxCut`** — the deepest discount the shop allows, whatever the ladder says.

So a brand is never undercut below the line its own seller drew. That is the
single most common objection from manufacturers, and it is enforced in code
rather than promised in a slide.

### Delisting thresholds

Remaining life is not one number for everything. It follows how long a pack takes
to finish, and how the buyer gets it.

| Category group | Collect | Deliver |
|---|---|---|
| Single-serve food, drinks, snacks | 2 days | 7 days |
| Multi-pack and family format | 7 days | 21 days |
| Household and personal care | 14 days | 30 days |
| Cosmetics | 30 days | 45 days |

A bag of crisps with two days left is perfectly fine if you collect it this
afternoon. The same bag shipped overnight is not. A jar of moisturiser works the
other way round: thirty days is still tight, because the pack takes months to use.

Below its threshold an item is delisted automatically — the card greys out and
explains why, and if it is still collectable it says to switch route.

### The time simulation

The dark blue bar under the header winds the clock forward up to sixty days.
Press play and watch every price, every life meter and every price chart move
together, and watch items delist as they cross their threshold. It is the fastest
way to see the whole model without waiting three months.

---

## What is in the storefront

| | |
|---|---|
| **Shop** | Category rail, search, four sort orders, collection/delivery routes |
| **Product page** | Gallery, live price, why it is discounted, a chart of the price against days left |
| **Basket** | Slide-over drawer, quantity caps per customer, promo code (`SAVE10`), free-delivery progress |
| **Checkout** | Route and time-window pick, payment choice, order summary that excludes anything now out of date |
| **Orders & saved** | Both kept in `localStorage`, so they survive a reload |
| **Buy for donation** | Pay the reduced price and a partner food bank collects the item the same day |
| **Picked for you** | Rule-based recommendations with the reason for each pick |
| **User research** | The eight customer groups from the business plan |

### Picked for you

Not a model. A transparent scoring function over the catalogue:

```
bought together   +3 × weight
same category     +2 × weight
same brand        +1 × weight
same pack format  +0.7 × weight
closer to date    +up to 0.8
```

Weights come from your own activity (ordered 3, in basket 2, saved 1). With no
history it falls back to one of three sample shoppers, and you can switch between
them to see the picks change. Every card shows which rule won, so the suggestion
can be argued with. Your history never leaves the browser.

---

## Project layout

```
index.html                 markup shell: header, time bar, drawer, footer
assets/
  css/
    tokens.css             colour, type scale, spacing, motion — the only raw values
    base.css               reset, typography, layout primitives, buttons
    components.css         header, mosaic, cards, drawer, checkout, footer
  js/
    data.js                catalogue, charities, personas, copy — read-only
    pricing.js             the ladder, the floor, freshness, eligibility (pure functions)
    store.js               state, localStorage, basket, orders, recommendations
    components.js          HTML builders: cards, charts, packshots, line items
    app.js                 views, hash router, event wiring
docs/
  DESIGN.md                the design system and the reasoning behind it
```

The dependency direction is one way and never loops:

```
data.js → pricing.js → store.js → components.js → app.js
```

`pricing.js` holds no state and touches no DOM, so the whole commercial model can
be reasoned about — or unit tested — on its own. `components.js` returns strings
and never mutates. Every mutation lives in the delegated handlers at the bottom
of `app.js`.

### Adding a product

Append to `CS.PRODUCTS` in `assets/js/data.js`:

```js
{
  id:'p13', name:'…', brand:'…', cat:'Snacks',
  group:'single',          // picks the delisting thresholds and the CO2e figure
  art:'pouch',             // drawn fallback: bottle carton pouch tin jar tube cup box
  c1:'#FBBF24', c2:'#D97706',
  img:'https://…',         // optional; leave '' to use the drawn pack
  base:18000,              // shelf price, dong
  left0:9,                 // days of life at listing
  floorPct:38,             // the shop's floor, % of shelf price
  maxCut:65,               // deepest discount the shop allows, %
  cap:6,                   // units per customer
  store:'…', km:1.2, rate:4.6, revs:38,
  why:'…',                 // why it is discounted — shown on the card and the page
  desc:'…'
}
```

The category rail, the sort orders, the recommendations and the counters all pick
it up with no other change.

---

## Design

Flat colour blocks, square corners, pill buttons, and a twelve-column mosaic with
thin white seams — a printed catalogue rather than a web app. The full system,
including why the brand green and the price red are the only two saturated colours
allowed on a product card, is written up in [`docs/DESIGN.md`](docs/DESIGN.md).

Accessibility: visible focus rings throughout, `aria-pressed` on every toggle,
`aria-live` on the toast, a skip link, keyboard-reachable controls, and
`prefers-reduced-motion` honoured by collapsing every transition to nothing.

Tested at 1440px, 1000px and 390px. No horizontal scroll at phone width, and a
bottom tab bar there so the basket is always one thumb away.

---

## Branches

| Branch | What is on it |
|---|---|
| `main` | The original upload |
| `claude/lucid-einstein-lf6ih1` | This rebuild |
| `archive/frontend-legacy` | The two original single-file prototypes, as `frontend-v1.html` and `frontend-v2.html` |

The pricing model, the catalogue and the copy were carried over from the legacy
build unchanged. The interface around them was rewritten.

---

## Honest limitations

- No backend. Orders go nowhere; the codes are random.
- No payment. MoMo, VNPay and cash on handover are labels on radio buttons.
- The charities, the donation counters and the CO2e figures are illustrative.
- The reviews and the research quotes are written from personas, not collected
  from real customers. Portraits are stock placeholders.
- Everything is stored per-browser, so clearing site data clears your orders.

---

## Credits

Product photography from [Unsplash](https://unsplash.com).
Portraits from [randomuser.me](https://randomuser.me).
Type is [Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans).
