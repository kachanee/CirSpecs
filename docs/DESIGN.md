# CirSpecs — design system

The reference was a printed furniture catalogue: full-bleed photography, flat
colour blocks, square corners, a headline that fills its panel, and a small round
arrow in the corner telling you the block is a door. That grammar suits a shop
whose whole proposition is a price on a shelf, so the storefront borrows the
structure and replaces the palette.

---

## 1. Colour

Everything is declared once in `assets/css/tokens.css`. No component file
contains a raw hex value.

### Surfaces

| Token | Value | Used for |
|---|---|---|
| `--paper` | `#FFFFFF` | cards, panels, the mosaic seams |
| `--sand` | `#F3EFE8` | the page itself — warm, so white panels read as objects on it |
| `--sand-2` | `#E9E3D8` | image wells, hover fills |
| `--line` | `#DBD4C8` | hairlines on sand |

A neutral grey page would have made the white product cards disappear. The warm
off-white gives every card a visible edge without needing a border.

### Brand

| Token | Value | Used for |
|---|---|---|
| `--brand` | `#0C5C3D` | primary buttons, the logo block, "you save", confirmations |
| `--brand-tint` | `#E3EFE8` | selected states, the donation panel |
| `--sun` | `#FFD400` | the discount flash, hero call to action, headline accents |

Green because the product is food that does not get thrown away, and the colour
has to carry that without a single leaf icon doing the work.

### Editorial blocks

`--brick` `#9E2B25` &middot; `--clay` `#DE5B1F` &middot; `--navy` `#153A5C` &middot;
`--plum` `#5A3769` &middot; `--cream` `#F6E7C8`

These are panel fills for the mosaic, never text, never borders, never small
elements. A panel is one flat colour edge to edge or it is a photograph; there is
no third option and no gradient.

### The one rule that matters

> **On a product card, only two saturated colours are allowed: `--price` red for
> the reduced price, and the freshness colour on the life meter.**

Everything else on a card is ink, grey or white. The red therefore means exactly
one thing — this is what you pay — and the eye finds it instantly across a grid
of twelve. The moment a third colour appears on a card, the price stops being the
loudest thing on it.

Freshness uses three steps, computed against the threshold for the current route:

| Remaining life | Colour | Label |
|---|---|---|
| more than threshold + 25 days | `--brand` green | Plenty of time |
| more than threshold + 7 days | `--warn` amber | Going soon |
| otherwise | `--price` red | Final days |

---

## 2. Type

[Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans), 400 to 800. It
carries full Vietnamese diacritics, which a surprising number of display faces do
not, and the shop names are Vietnamese.

Headlines run at 800 with `letter-spacing: -0.035em` and a line height near 1.0.
Tight and heavy is the whole voice; at 700 and 1.2 the same words read as a
dashboard.

The scale is fluid, defined once:

```css
--t-micro: .6875rem                          /* eyebrows, the discount flash */
--t-xs:    .75rem                            /* meta, captions */
--t-base:  .9375rem                          /* body */
--t-lg:    clamp(1.25rem, 1.1rem + .7vw, 1.5rem)
--t-xl:    clamp(1.6rem, 1.3rem + 1.5vw, 2.25rem)
--t-2xl:   clamp(2rem, 1.4rem + 3vw, 3.25rem)
--t-3xl:   clamp(2.4rem, 1.5rem + 4.4vw, 4.5rem)
```

Numbers are `font-variant-numeric: tabular-nums` globally, so prices and day
counts do not shift width as the clock runs. Without it the whole grid twitches
on every tick of the simulation.

Every section opens the same way: an uppercase eyebrow, a heading, one line of
explanation. Never a heading alone.

---

## 3. Shape

| Thing | Radius |
|---|---|
| Tiles, panels, cards, the discount flash | `0` |
| Inputs | `4px` |
| Every button, every chip, every badge | fully round |

Square panels against fully round controls is the one deliberate tension in the
system. It makes anything pressable obvious without an outline, a shadow or a
hover state — the shape alone says it.

Shadows are used sparingly and only to lift something off the page: the drawer,
the toast, the corner arrows. Panels sit flat.

---

## 4. The mosaic

Editorial sections are a twelve-column grid with an 8px white seam:

```css
.mosaic{ display:grid; grid-template-columns:repeat(12,1fr);
         gap:var(--gutter); background:var(--paper); padding:var(--gutter) }
.tile  { grid-column:span var(--c,6); min-height:calc(var(--r,2) * 150px) }
```

A tile declares its own footprint inline — `style="--c:8;--r:3"` — so a section's
rhythm is readable in the markup instead of buried in a class name like
`tile--large-left`. The hero additionally spans two grid rows so the two tiles
beside it stack.

Rules for a tile:

- One flat colour, or one photograph. Never both, never a gradient fill.
- The caption sits at the foot, aligned with the padding, always in the same
  order: eyebrow, title, body.
- A photo tile carries a bottom-weighted scrim and a solid dark fallback
  background, so the caption is legible before the photo loads, and still legible
  if it never does.
- A tile that navigates is an `<a>` and carries a round arrow at bottom right.
  A tile that does not, does not get one.

Below 1000px every tile spans the full width unless it overrides `--cm`.

---

## 5. The product card

Reading order is deliberately price first:

```
price (red, bold)  →  name  →  brand · shop  →  rating  →  life meter  →  days left
```

Shopping here is price-led; the name is the confirmation, not the hook. The
discount flash is a square yellow label pinned to the top-left corner of the
image, borrowed straight from a shelf edge, and it is the only square-cornered
badge in the system.

The life meter is the honest part. It is the width of the remaining days against
the life the item was listed with, coloured by freshness, with the exact day
count and the next price drop spelled out underneath. A shopper deciding whether
to buy a short-dated item needs the number, not a vibe.

Quick actions fade in on hover and are permanently visible under
`@media (hover:none)`, because a card whose primary action only exists on hover is
a card with no primary action on a phone.

---

## 6. Motion

One easing curve, `cubic-bezier(.22,1,.36,1)`, and three durations: `--fast` for
colour, `--mid` for transforms and panels, `--slow` for image scale.

Motion is only used to explain something: the drawer slides from the edge it
belongs to, the toast rises from the bottom, a tile photo scales a little under
the cursor to show it is a door. Nothing animates on load, and nothing bounces.

`prefers-reduced-motion: reduce` collapses all three duration tokens to
`0.001ms`, which neutralises every transition in the build at once because no
component hardcodes a duration.

---

## 7. Accessibility

- A 3px `--brand` focus ring with 3px offset on every focusable thing, never
  removed.
- `aria-pressed` on the route, sort, category and profile toggles; `aria-expanded`
  on the basket button; `aria-current` on the phone tab bar.
- The toast is `role="status"` with `aria-live="polite"`, so an "added to basket"
  is announced without stealing focus.
- Both charts carry an `aria-label` stating what the line does, since an SVG of a
  falling price is meaningless to a screen reader otherwise.
- A skip link ahead of the header.
- `[hidden]` is forced to `display:none` in `base.css`, because several components
  set an explicit `display` that would otherwise win over the user-agent rule and
  leave empty count badges on screen.

---

## 8. Layout breakpoints

| Width | What changes |
|---|---|
| 1000px | mosaic tiles go full width |
| 860px | search moves to its own row; phone tab bar appears; the toast lifts above it |
| 700px | the right-hand note in the top bar is dropped |
| 620px | two-column form grids collapse |
| 460px | the product grid holds two columns rather than one |

The sticky offset for the time bar is measured from the masthead in JavaScript
and written to `--masthead-h`, because the masthead gains a row at 860px and a
hardcoded `top` would leave a gap or an overlap at exactly the width where the
layout is tightest.
