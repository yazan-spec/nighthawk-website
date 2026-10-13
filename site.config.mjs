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
      { project: '12459-mooremeadow', index: 3, mobile: 2 },
      { project: 'the-james-whiskey-bar', index: 0, mobile: 1 },
      { project: '7210-dearborn', index: 1 },
      { project: 'fioras-wine-bar', index: 1, mobile: 7 },
      { project: 'duo-spin-pilates', index: 2 },
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

  // Contact form. 'netlify' works with no backend when deployed to Netlify.
  // Set provider to 'endpoint' and `endpoint` to a Formspree/Basin/own URL for other hosts.
  form: { provider: 'netlify', endpoint: '' },
};
