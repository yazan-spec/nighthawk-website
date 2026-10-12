// Project metadata and editorial direction.
//
// Photos live in content/photo-manifest.txt (one line per project, cover first).
// This file adds what the photographs can't: slug, sector, ordering, short narrative,
// and — for featured case studies — a hand-sequenced layout.
//
// ADDING A PROJECT
//   1. Add a line to photo-manifest.txt (or list local files, see README).
//   2. Add an entry below with at least { title, sectors }.
//   3. npm run build
//
// Sequence blocks (indices point into that project's photo list, 0 = cover):
//   { full: i }            full-bleed image                        (needs a large original)
//   { inset: i }           wide image inside the margins
//   { pair: [a, b] }       two images on one baseline, widths follow their proportions
//   { trio: [a, b, c] }    three images on one baseline
//   { offset: i, side }    single image set to one side, whitespace on the other
//   { detail: i }          small detail image, set off-centre
//   { text: true }         where the narrative paragraph sits
// Projects without a `sequence` are laid out automatically from image size and proportion.
//
// ACCURACY: leave location / year / scope / credits as null unless confirmed.

export const sectors = {
  residential: {
    name: 'Custom Residential',
    nav: 'Residential',
    lede: 'Houses built from the slab up, and existing homes taken back to the frame and rebuilt.',
    hero: { project: '7210-dearborn', index: 0 },
  },
  hospitality: {
    name: 'Hospitality',
    nav: 'Hospitality',
    lede: 'Bars, restaurants and cafés, built for the night they open and the years after.',
    hero: { project: 'the-james-whiskey-bar', index: 10 },
  },
  commercial: {
    name: 'Commercial',
    nav: 'Commercial',
    lede: 'Tenant build-outs and commercial interiors, delivered on an operator’s schedule.',
    hero: { project: 'duo-spin-pilates', index: 2 },
  },
  development: {
    name: 'Development',
    nav: 'Development',
    lede: 'Builder services and investment properties, from land and feasibility through to a finished, saleable building.',
    hero: { project: '2926-fontana', index: 0 },
  },
};

export const projects = [
  // ——— Hospitality ———
  {
    title: 'The James Whiskey Bar',
    sectors: ['hospitality'],
    featured: 1,
    narrative:
      'A run of timber vaults carries the eye the full length of the bar, each arch lit from within above a glowing bar top. Arched passages and a black-and-white corridor carry the same language through the rest of the room.',
    sequence: [
      { full: 3 }, { text: true }, { pair: [1, 2] }, { full: 10 }, { offset: 6, side: 'right' },
      { trio: [4, 8, 12] }, { inset: 9 }, { pair: [5, 11] }, { detail: 7 },
    ],
  },
  {
    title: "Fiora's Wine Bar",
    sectors: ['hospitality'],
    featured: 3,
    narrative:
      'Arched wine displays, green-tiled counters and a ceiling hung with planting, in a room opened up to daylight.',
    sequence: [
      { full: 1 }, { text: true }, { pair: [2, 7] }, { full: 4 }, { offset: 12, side: 'left' },
      { trio: [8, 10, 11] }, { inset: 9 }, { pair: [5, 6] }, { offset: 3, side: 'right' }, { pair: [13, 14] },
    ],
  },
  {
    title: 'Permission Whiskey Bar',
    sectors: ['hospitality'],
    narrative:
      'Floor-to-ceiling shelving in warm timber turns the collection into the room itself, with velvet booths and a lit bar below.',
    credits: { photography: 'Mark Johnson Photography' },
    sequence: [
      { inset: 1 }, { text: true }, { inset: 2 }, { pair: [3, 4] }, { offset: 5, side: 'right' },
      { pair: [6, 7] }, { inset: 8 }, { pair: [9, 10] }, { detail: 11 },
    ],
  },
  {
    title: 'DUO Coffee',
    sectors: ['hospitality', 'commercial'],
    narrative:
      'A ground-floor café behind full-height glass, with warm timber, a long window counter and built-in display shelving.',
    sequence: [
      { full: 1 }, { text: true }, { pair: [2, 3] }, { offset: 4, side: 'right' }, { inset: 8 },
      { pair: [5, 6] }, { detail: 7 },
    ],
  },
  {
    title: 'Oakmont Beer Garden',
    sectors: ['hospitality'],
    narrative:
      'Indoor bars and an outdoor garden under string lights, built to hold a crowd.',
  },

  // ——— Commercial ———
  {
    title: 'DUO Spin & Pilates',
    slug: 'duo-spin-pilates',
    sectors: ['commercial'],
    featured: 6,
    narrative:
      'Studios built around light: arched portals, colour-washed rooms and an instructor stage that can be lit for every class.',
    sequence: [
      { full: 1 }, { text: true }, { pair: [4, 7] }, { full: 2 }, { offset: 3, side: 'left' },
      { pair: [5, 6] }, { inset: 8 }, { detail: 9 },
    ],
  },

  // ——— Residential: featured ———
  {
    title: '12459 Mooremeadow',
    sectors: ['residential'],
    featured: 2,
    narrative:
      'Fluted walnut, violet-veined marble and handmade green tile. A family house finished in close detail, room by room.',
    sequence: [
      { inset: 1 }, { text: true }, { trio: [2, 4, 6] }, { pair: [3, 7] }, { offset: 10, side: 'right' },
      { pair: [5, 8] }, { trio: [12, 13, 14] }, { pair: [9, 11] },
    ],
  },
  {
    title: '7210 Dearborn',
    sectors: ['residential'],
    featured: 4,
    narrative:
      'A two-storey house of steel-framed glazing, grey-green millwork and pale oak, arranged around a stair that rises through the full height of the home.',
    sequence: [
      { full: 1 }, { text: true }, { pair: [2, 3] }, { full: 5 }, { offset: 4, side: 'left' },
      { pair: [6, 7] }, { inset: 8 }, { pair: [9, 10] }, { full: 11 }, { detail: 12 },
    ],
  },
  {
    title: '2727 Kirby',
    sectors: ['residential'],
    featured: 5,
    narrative:
      'A high-rise residence in deep tones: black millwork, floor-to-ceiling glass and a library wall that faces the skyline.',
    sequence: [{ text: true }, { trio: [1, 2, 3] }, { pair: [4, 5] }, { offset: 6, side: 'left' }, { detail: 9 }],
  },
  {
    title: '10135 Kerrwood',
    sectors: ['residential'],
    featured: 7,
    narrative:
      'Charcoal board-and-batten over a stone base, timber entry doors and a single, low roofline set back among mature trees.',
  },

  // ——— Residential: archive (auto layout) ———
  { title: '6911 Hartland', sectors: ['residential'] },
  { title: '9851 Warwana', sectors: ['residential'] },
  { title: '1703 Reverse', sectors: ['residential'] },
  { title: '1810 Woodcrest', sectors: ['residential'] },
  { title: '10322 Raritan', sectors: ['residential'] },
  { title: '2922 Stetson', sectors: ['residential'] },
  { title: '2918 Stetson', sectors: ['residential'] },
  { title: '1802 Mill Creek', sectors: ['residential'] },
  { title: '10137 Kerrwood', sectors: ['residential'] },
  { title: '2719 Stetson', sectors: ['residential'] },
  { title: '1516 Holly', sectors: ['residential'] },
  { title: '807 Saybrook', sectors: ['residential'] },
  { title: '6638 N Main', sectors: ['residential'] },
  { title: '2107 Teague', sectors: ['residential'] },
  { title: '1714 Nocturne', sectors: ['residential'] },
  { title: '931 Key', sectors: ['residential'] },
  { title: '1818 Parana', sectors: ['residential'] },
  { title: '1923 Chaparral', sectors: ['residential'] },
  { title: '1927 Chaparral', sectors: ['residential'] },
  { title: '2626 Teague', sectors: ['residential'] },
  { title: '2926 Fontana', sectors: ['residential'] },
  { title: '10131 Tiara', sectors: ['residential'] },
  { title: '1810 Nauts', sectors: ['residential'] },
  { title: '2610 Pine Village', sectors: ['residential'] },
  { title: '1311 Jeannine', sectors: ['residential'] },
  { title: '1635 Scenic', sectors: ['residential'] },
  { title: '10421 Moorberry', sectors: ['residential'] },
  { title: '10143 Kerrwood', sectors: ['residential'] },
  { title: '2911 Stetson', sectors: ['residential'] },
  { title: '2527 Droxford', sectors: ['residential'] },
  { title: '2431 Droxford', sectors: ['residential'] },
  { title: '10414 Chatterton', sectors: ['residential'] },
  { title: '2631 Rosefield', sectors: ['residential'] },
  { title: '2606 Rosefield', sectors: ['residential'] },
  { title: '2750 Quincannon', sectors: ['residential'] },
  { title: '2822 Stetson', sectors: ['residential'] },
  { title: '2723 Manila', sectors: ['residential'] },
];

// Archive projects (no hand sequence) show at most this many photographs:
// the strongest few, rather than every angle of every room.
export const ARCHIVE_PHOTO_LIMIT = 8;
