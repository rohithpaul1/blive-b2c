// Brand accent for a franchise site, as CSS variables on :root.
// Components use var(--accent) and its tints instead of a hard-coded hex, so one
// build can wear each franchise's colour. App.css holds Jaipur's values as defaults.

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const rgbToHex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
// `share` of the accent mixed into `toward` (white or black).
const mix = (hex, share, toward) => {
  const a = hexToRgb(hex);
  const b = hexToRgb(toward);
  return rgbToHex(a.map((v, i) => v * share + b[i] * (1 - share)));
};

// Tint shares measured from Jaipur's palette, so another accent gets the same lightness steps.
const TINTS = { 5: 0.051, 9: 0.086, 10: 0.1, 13: 0.133, 16: 0.157, 35: 0.345, 40: 0.397, 48: 0.484 };

export const paletteFor = (accent) => {
  const vars = { "--accent": accent, "--accent-hover": mix(accent, 0.85, "#000000") };
  for (const [step, share] of Object.entries(TINTS)) vars[`--accent-tint-${step}`] = mix(accent, share, "#ffffff");
  return vars;
};

export const applyTheme = (franchise, accentOverride) => {
  const root = document.documentElement;
  const palette = accentOverride ? paletteFor(accentOverride) : franchise.palette;
  for (const [key, value] of Object.entries(palette)) root.style.setProperty(key, value);
  root.style.setProperty("--blive-purple", palette["--accent"]);
  root.style.setProperty("--blive-purple-hover", palette["--accent-hover"]);
  root.style.setProperty(
    "--hero-image",
    franchise.heroImage
      ? `url("${franchise.heroImage}")`
      : `radial-gradient(80% 90% at 85% 20%, ${palette["--accent"]} 0%, #0f0d16 70%)`
  );
  // Photo tile on the homepage; without a photo, a dark glow in the accent colour.
  root.style.setProperty(
    "--tile-image",
    franchise.tileImage
      ? `url("${franchise.tileImage}")`
      : `radial-gradient(70% 60% at 30% 30%, ${palette["--accent"]} 0%, #0f0d16 80%)`
  );
  // Testimonial band: set quoteImage to null when the tile photo is too small to run full width.
  if (franchise.quoteImage === null)
    root.style.setProperty("--quote-image", `radial-gradient(60% 90% at 20% 0%, ${palette["--accent"]} 0%, #0f0d16 75%)`);
  else if (franchise.quoteImage) root.style.setProperty("--quote-image", `url("${franchise.quoteImage}")`);
  else root.style.removeProperty("--quote-image");
  root.dataset.franchise = franchise.slug;
  if (franchise.seo?.title) document.title = franchise.seo.title;
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute("content", palette["--accent"]);
};
