/* ===========================================================================
   CirSpecs — catalogue and copy
   Everything the storefront reads but never writes. No DOM, no state.
   =========================================================================== */

window.CS = window.CS || {};

(function (CS) {
  'use strict';

  /* Currency and the two logistics numbers the demo runs on. */
  CS.SHIP_FEE = 15000;
  CS.FREE_SHIP = 250000;

  /* How many days of life an item must still have to be sold on each route.
     Collection is same-day, so it tolerates far shorter dates than delivery. */
  CS.FLOORS = {
    single:   { pickup: 2,  delivery: 7,  label: 'Single-serve food, drinks, snacks' },
    multi:    { pickup: 7,  delivery: 21, label: 'Multi-pack and family format' },
    home:     { pickup: 14, delivery: 30, label: 'Household and personal care' },
    cosmetic: { pickup: 30, delivery: 45, label: 'Cosmetics' }
  };

  /* Grams of CO2e avoided per unit kept out of the bin. Rough, illustrative. */
  CS.CO2 = { single: 220, multi: 900, home: 1400, cosmetic: 800 };

  CS.PRODUCTS = [
    { id:'p1', name:'Seaweed potato crisps 54g', brand:'Oishi', cat:'Snacks', group:'single', art:'pouch',
      c1:'#FBBF24', c2:'#D97706', base:18000, left0:9, floorPct:38, maxCut:65, cap:6,
      img:'https://images.unsplash.com/photo-1641693148759-843d17ceac24?w=800&q=80&auto=format&fit=crop',
      store:'Minimart An Phú', km:1.2, rate:4.6, revs:38,
      why:'Ordered in for the holiday, and the holiday is over.',
      desc:'Sealed 54g bag, stored dry. Genuine stock through the local distributor.' },

    { id:'p2', name:'Lemon sparkling water 500ml, pack of 6', brand:'Aquafina', cat:'Drinks', group:'single', art:'bottle',
      c1:'#38BDF8', c2:'#0284C7', base:42000, left0:14, floorPct:40, maxCut:65, cap:4,
      img:'https://images.unsplash.com/photo-1561041695-d2fadf9f318c?w=800&q=80&auto=format&fit=crop',
      store:'Minimart An Phú', km:1.2, rate:4.8, revs:51,
      why:'Over-ordered for the summer promotion and never cleared.',
      desc:'Pack of six 500ml bottles. Shrink wrap intact, pack not split.' },

    { id:'p3', name:'Hot and sour shrimp cup noodles 65g', brand:'Hảo Hảo', cat:'Snacks', group:'single', art:'cup',
      c1:'#F87171', c2:'#DC2626', base:15000, left0:31, floorPct:40, maxCut:60, cap:8,
      img:'https://images.unsplash.com/photo-1628610688436-e635552020fc?w=800&q=80&auto=format&fit=crop',
      store:'Minimart Tân Bình', km:4.1, rate:4.7, revs:124,
      why:'The brand changed the cup design, so the old run has to go.',
      desc:'65g cup with fork included. The date is printed on the base and was photographed at listing.' },

    { id:'p4', name:'UHT fresh milk 1L, pack of 4', brand:'Vinamilk', cat:'Dairy & drinks', group:'multi', art:'carton',
      c1:'#60A5FA', c2:'#1D4ED8', base:128000, left0:44, floorPct:45, maxCut:55, cap:3,
      img:'https://images.unsplash.com/photo-1553301803-768cd4a59b9c?w=800&q=80&auto=format&fit=crop',
      store:'Co.opmart Gò Vấp', km:2.8, rate:4.9, revs:87,
      why:'Over-ordered on promotion, and the shop needs the space for the new run.',
      desc:'Four 1L cartons, UHT treated, stored at room temperature.' },

    { id:'p5', name:'3-in-1 instant coffee, box of 21', brand:'Trung Nguyên', cat:'Dairy & drinks', group:'multi', art:'box',
      c1:'#A78BFA', c2:'#6D28D9', base:72000, left0:68, floorPct:42, maxCut:55, cap:4,
      img:'https://images.unsplash.com/photo-1643426879831-b20d0d9e0110?w=800&q=80&auto=format&fit=crop',
      store:'Minimart An Phú', km:1.2, rate:4.5, revs:63,
      why:'Ordered too much, and the stockroom ran out of space.',
      desc:'Box of 21 sachets, 16g each. Box seal unbroken.' },

    { id:'p6', name:'Butter biscuits, 600g tin', brand:'Kinh Đô', cat:'Biscuits & sweets', group:'multi', art:'tin',
      c1:'#FCD34D', c2:'#B45309', base:145000, left0:96, floorPct:44, maxCut:55, cap:3,
      img:'https://images.unsplash.com/photo-1545754605-bcade396d00e?w=800&q=80&auto=format&fit=crop',
      store:'Minimart Tân Bình', km:4.1, rate:4.4, revs:29,
      why:'Brought in for the festive season, left over once it passed.',
      desc:'600g tin, suitable as a gift. No dents to the tin.' },

    { id:'p7', name:'Front-load laundry detergent 3.7kg', brand:'Omo', cat:'Household', group:'home', art:'jar',
      c1:'#34D399', c2:'#047857', base:285000, left0:121, floorPct:45, maxCut:50, cap:2,
      img:'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=800&q=80&auto=format&fit=crop',
      store:'Co.opmart Gò Vấp', km:2.8, rate:4.8, revs:142,
      why:'The brand changed its packaging, so the old run has to clear.',
      desc:'3.7kg container for front-load machines. Cap still sealed.' },

    { id:'p8', name:'Pomelo shampoo 650ml', brand:'Cocoon', cat:'Personal care', group:'home', art:'bottle',
      c1:'#86EFAC', c2:'#15803D', base:96000, left0:58, floorPct:46, maxCut:50, cap:3,
      img:'https://images.unsplash.com/photo-1701992678972-d5a053ad0fb0?w=800&q=80&auto=format&fit=crop',
      store:'Tạp hoá Bà Chiểu', km:3.4, rate:4.7, revs:95,
      why:'The shop has stopped carrying this line and is clearing the rest.',
      desc:'650ml sulfate-free bottle. Bottle intact, pump included.' },

    { id:'p9', name:'Night moisturiser 50ml', brand:'La Roche-Posay', cat:'Cosmetics', group:'cosmetic', art:'jar',
      c1:'#C4B5FD', c2:'#5B21B6', base:320000, left0:92, floorPct:50, maxCut:45, cap:2,
      img:'https://images.unsplash.com/photo-1763503839418-2b45c3d7a3c3?w=800&q=80&auto=format&fit=crop',
      store:'Hasaki Nguyễn Trãi', km:2.8, rate:4.9, revs:211,
      why:'Short-dated batch moved down from the regional warehouse.',
      desc:'50ml jar with foil seal and outer carton. Date printed on the base.' },

    { id:'p10', name:'Tinted lip balm 3.5g', brand:'Maybelline', cat:'Cosmetics', group:'cosmetic', art:'tube',
      c1:'#FDA4AF', c2:'#BE123C', base:145000, left0:64, floorPct:48, maxCut:45, cap:3,
      img:'https://images.unsplash.com/photo-1666594171486-858f82f5b191?w=800&q=80&auto=format&fit=crop',
      store:'Guardian Nguyễn Sơn', km:3.4, rate:4.6, revs:76,
      why:'New collection shades launched, so this code is discontinued.',
      desc:'3.5g stick, seal unbroken. Shade code on the base.' },

    { id:'p11', name:'Lemon dish soap 3.8kg', brand:'Sunlight', cat:'Household', group:'home', art:'bottle',
      c1:'#FDE68A', c2:'#CA8A04', base:165000, left0:34, floorPct:44, maxCut:50, cap:2,
      img:'https://images.unsplash.com/photo-1649005011845-ef225c89da86?w=800&q=80&auto=format&fit=crop',
      store:'Tạp hoá Bà Chiểu', km:3.4, rate:4.5, revs:58,
      why:'Over-ordered on promotion and not cleared within the quarter.',
      desc:'3.8kg container with pump. No leaks to the body.' },

    { id:'p12', name:'Cheese rice crackers, bag of 12', brand:'Ichi', cat:'Biscuits & sweets', group:'multi', art:'pouch',
      c1:'#FDBA74', c2:'#C2410C', base:58000, left0:25, floorPct:42, maxCut:60, cap:5,
      img:'https://images.unsplash.com/photo-1708746333890-8e775f97f0a6?w=800&q=80&auto=format&fit=crop',
      store:'Minimart Tân Bình', km:4.1, rate:4.3, revs:41,
      why:'Display stock from a promotion, left over once it ended.',
      desc:'Large bag holding 12 individual packs. Outer bag still sealed.' }
  ];

  /* Buyer reviews, keyed by product id. */
  CS.REVIEWS = {
    p4: [
      { n:'Chi',  c:'#0C5C3D', d:'3 days ago', img:'https://randomuser.me/api/portraits/women/26.jpg',
        t:'Bought two packs for a family of four and we got through them in a fortnight. Almost half what the supermarket near us charges.' },
      { n:'Hưng', c:'#153A5C', d:'1 week ago', img:'https://randomuser.me/api/portraits/men/45.jpg',
        t:'Cartons intact and the date matched what the site said. Collection at the shop was quick, no waiting around.' }
    ],
    p1: [
      { n:'Minh', c:'#0C5C3D', d:'2 days ago', img:'https://randomuser.me/api/portraits/men/12.jpg',
        t:'Only a few days left, but I finish a bag within the week anyway. At this price it is a very easy yes.' }
    ],
    p9: [
      { n:'Linh', c:'#5A3769', d:'5 days ago', img:'https://randomuser.me/api/portraits/women/33.jpg',
        t:'Seal unbroken, over two months left. I like that it says why it is discounted; reading that settled it for me.' }
    ]
  };

  /* Research personas. Illustrative responses built from the business plan,
     not quotations from real customers. Portraits are stock placeholders. */
  CS.VOICES = [
    { n:'Mr Dung', c:'#0C5C3D', r:'Owner of two minimarts, Binh Thanh', img:'https://randomuser.me/api/portraits/men/32.jpg',
      q:'Those cases used to sit in the back room until I had to throw them out. Now I list in the morning and someone collects in the afternoon. What I need to know is when I get paid.' },
    { n:'Ms Hanh', c:'#153A5C', r:'Category manager, 60-store chain', img:'https://randomuser.me/api/portraits/women/44.jpg',
      q:'I do not buy from a presentation. Give me ninety days across five stores, then put your recovery figures next to my own clearance shelf.' },
    { n:'Mr Quang', c:'#9E2B25', r:'Trade marketing, FMCG manufacturer', img:'https://randomuser.me/api/portraits/men/68.jpg',
      q:'My problem is not the price, it is the exposure. Show me the floor price is genuinely enforced and then we can talk.' },
    { n:'Ms Mai', c:'#5A3769', r:'Category lead, super-app', img:'https://randomuser.me/api/portraits/women/65.jpg',
      q:'What I cannot assemble myself is several hundred verified small shops. Bring that, and carry the shelf-life responsibility, and I can get it approved.' },
    { n:'Minh', c:'#DE5B1F', r:'21, student in shared accommodation', img:'https://randomuser.me/api/portraits/men/12.jpg',
      q:'I am buying noodles and shower gel anyway. Forty per cent off and within walking distance, so why would I not.' },
    { n:'Ms Chi', c:'#0C5C3D', r:'34, two young children, Go Vap', img:'https://randomuser.me/api/portraits/women/26.jpg',
      q:'What worries me is buying more than we can get through. The line showing the days left, and the cap on quantity, are what make me comfortable ordering.' },
    { n:'Linh', c:'#5A3769', r:'27, office worker in District 1', img:'https://randomuser.me/api/portraits/women/33.jpg',
      q:'I like that it states why something is discounted. You understand what you are buying, and it is easy to explain to friends.' },
    { n:'Ms Thuy', c:'#131210', r:'Programme coordinator, food bank', img:'https://randomuser.me/api/portraits/women/12.jpg',
      q:'Donations arrive unpredictably, often too close to the date to distribute safely. We need a steady supply and a record we can report against.' }
  ];

  /* Charities that collect donated stock. */
  CS.PARTNERS = [
    { id:'a', name:'Hope Pantry', area:'District 8', serves:'Weekly food boxes for about 120 households.',
      img:'https://images.unsplash.com/photo-1593113616828-6f22bca04804?w=800&q=80&auto=format&fit=crop' },
    { id:'b', name:'Green Rice Kitchen', area:'Go Vap', serves:'Free lunches for day labourers and street vendors.',
      img:'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?w=800&q=80&auto=format&fit=crop' },
    { id:'c', name:'Little Steps Shelter', area:'Thu Duc', serves:'Daily supplies for 40 children and their carers.',
      img:'https://images.unsplash.com/photo-1628717341663-0007b0ee2597?w=800&q=80&auto=format&fit=crop' }
  ];
  CS.DON_BASE = { units: 1248 };

  /* Stand-in shopper histories for the recommendation demo. */
  CS.PROFILES = {
    student: { label:'Student',        hist:['p3','p8'] },
    family:  { label:'Family of four', hist:['p4','p7','p11'] },
    office:  { label:'Office worker',  hist:['p5','p9'] }
  };

  /* "Bought together" adjacency, hand-written rather than mined. */
  CS.TOGETHER = {
    p1:['p2','p12'], p2:['p1','p3'],  p3:['p2','p1'],  p4:['p6','p5'],
    p5:['p6','p4'],  p6:['p5','p4'],  p7:['p11','p8'], p8:['p11','p9'],
    p9:['p10','p8'], p10:['p9'],      p11:['p7','p8'], p12:['p1','p2']
  };

  /* Editorial photography for the mosaic. */
  CS.SCENES = {
    shelf:   'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1400&q=80&auto=format&fit=crop',
    basket:  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80&auto=format&fit=crop',
    kitchen: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&q=80&auto=format&fit=crop',
    volunteer:'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=1200&q=80&auto=format&fit=crop',
    shopkeep:'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&q=80&auto=format&fit=crop'
  };

})(window.CS);
