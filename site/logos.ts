/** Logos inventés pour les démonstrations : un sombre, un blanc, un coloré, un en dégradé. */
const svg = (bg: string, fg: string, glyph: string, defs = '') =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs}</defs><rect width="100" height="100" fill="${bg}"/>${glyph.replace(/FG/g, fg)}</svg>`)

export const LOGOS = [
  { name: 'Nocturne', src: svg('#0b0b0d', '#e5484d', '<path d="M30 22h12l16 34V22h12v56H58L42 44v34H30z" fill="FG"/>') },
  { name: 'Clarté', src: svg('#ffffff', '#2563eb', '<circle cx="50" cy="50" r="24" fill="none" stroke="FG" stroke-width="10"/><circle cx="50" cy="50" r="7" fill="FG"/>') },
  { name: 'Braise', src: svg('#f06a2a', '#ffffff', '<path d="M28 70 50 26l22 44z" fill="FG"/>') },
  {
    name: 'Lagune',
    src: svg(
      'url(#g)',
      '#e7fbff',
      '<path d="M24 58c10-12 20-12 26 0s16 12 26 0" fill="none" stroke="FG" stroke-width="8" stroke-linecap="round"/>',
      '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d3b4a"/><stop offset="1" stop-color="#2bb3b8"/></linearGradient>',
    ),
  },
] as const
