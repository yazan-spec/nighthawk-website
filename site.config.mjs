// Site-wide settings. Everything here was verified against nighthawkcg.com (October 2026).
// Edit this file to change company details, navigation or the homepage hero.

export default {
  name: 'Nighthawk Construction Group',
  shortName: 'Nighthawk',
  url: 'https://www.nighthawkcg.com', // canonical production origin (used for SEO tags + sitemap)
  locale: 'en_US',
  description:
    'Nighthawk Construction Group is a Houston general contractor and design–build firm delivering custom residences, hospitality interiors and commercial build-outs.',

  contact: {
    email: 'info@nighthawkcg.com',
    phone: '(832) 972-7007',
    phoneE164: '+18329727007',
    street: '2204 Summer Street #100',
    city: 'Houston',
    region: 'TX',
    postalCode: '77007',
    country: 'US',
  },

  social: {
    instagram: 'https://www.instagram.com/nighthawk.cg/',
    facebook: 'https://www.facebook.com/nighthawkconstructiongroup',
  },

  // Homepage hero.
  // When the construction-sequence film exists, add it to /media/hero and fill `video`.
  // `chapters` (seconds) drive the small progress index shown over the film.
  hero: {
    // Cinematic sequence of stills, shown until the construction film exists.
    // Each entry: project slug + photo index (see content/photo-manifest.txt), optional portrait index for phones.
    slides: [
      { project: 'the-james-whiskey-bar', index: 0, mobile: 1 },
      { project: 'fioras-wine-bar', index: 0, mobile: 5 },
      { project: 'duo-spin-pilates', index: 0 },
      { project: '12459-mooremeadow', index: 5, mobile: 5 },
      { project: 'permission-whiskey-bar', index: 0 },
    ],
    interval: 7000, // ms per still
    video: null,
    // video: {
    //   desktop: [{ src: '/media/hero/nighthawk-build-2560.webm', type: 'video/webm' },
    //             { src: '/media/hero/nighthawk-build-2560.mp4',  type: 'video/mp4' }],
    //   mobile:  [{ src: '/media/hero/nighthawk-build-1080x1920.mp4', type: 'video/mp4' }],
    //   project: '<slug of the project being filmed>',
    // },
    chapters: [
      { at: 0, label: 'Site' },
      { at: 6, label: 'Excavation' },
      { at: 11, label: 'Foundation' },
      { at: 17, label: 'Framing' },
      { at: 24, label: 'Enclosure' },
      { at: 31, label: 'Exterior' },
      { at: 38, label: 'Completed' },
      { at: 45, label: 'Interiors' },
    ],
  },

  // Homepage "Selected work": full-screen panels, in order. index = position in that project's photo list (0 = cover = photograph 01 on disk).
  featured: [
    { project: 'the-james-whiskey-bar', index: 0 },
    { project: '12459-mooremeadow', index: 4 },
    { project: 'fioras-wine-bar', index: 0 },
    { project: '6911-hartland', index: 0 },
    { project: '2727-kirby', index: 2 },
    { project: 'duo-spin-pilates', index: 2 },
  ],
  // Homepage "Details" strip: the owner's hand-picked photographs (project title + photograph number as on disk).
  details: [
    ['DUO Spin & Pilates', 2], ['6911 Hartland', 19], ['The James Whiskey Bar', 2], ['9851 Warwana', 11], ['1703 Reverse', 17],
    ['DUO Spin & Pilates', 10], ['12459 Mooremeadow', 5], ["Fiora's Wine Bar", 1], ['1810 Woodcrest', 19], ['6911 Hartland', 17],
    ['7210 Dearborn', 5], ['DUO Coffee', 6], ['The James Whiskey Bar', 3], ['1703 Reverse', 13], ['12459 Mooremeadow', 13],
    ['DUO Spin & Pilates', 5], ['1810 Woodcrest', 18], ['7210 Dearborn', 8], ['DUO Coffee', 3], ['1703 Reverse', 6],
  ],

  // Contact form. 'netlify' works with no backend when deployed to Netlify.
  // Set provider to 'endpoint' and `endpoint` to a Formspree/Basin/own URL for other hosts.
  form: { provider: 'netlify', endpoint: '' },
};
