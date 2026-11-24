// Colour tone mapping. Ported from teas.js / LibraryView.jsx in the design kit.

// One tone per tea family, so no two read alike. Everything is mixed from the four
// palette hues in tokens/colors.css rather than hardcoded, so the dark paper theme —
// which redefines those same variables — recolours along with it.
//
// The ladder tracks the leaf: fresh green, pale silver-sage, ochre, roast amber,
// red, deep earth.
export const TONES = {
  // 绿 — fresh leaf
  green: {
    ink: "var(--green-deep)",
    line: "var(--green)",
    chip: "var(--green)",
    fill: "color-mix(in srgb, var(--green-pale) 34%, var(--cream))",
  },
  // 白 — silver down on the bud: green drained toward the paper
  sage: {
    ink: "color-mix(in srgb, var(--brown-soft) 55%, var(--green-deep))",
    line: "color-mix(in srgb, var(--green) 45%, var(--brown-pale))",
    chip: "color-mix(in srgb, var(--brown-soft) 70%, var(--green))",
    fill: "color-mix(in srgb, var(--green-pale) 12%, var(--cream))",
  },
  // 黄 — ochre
  yellow: {
    ink: "var(--yellow-deep)",
    line: "var(--yellow)",
    chip: "var(--yellow-deep)",
    fill: "color-mix(in srgb, var(--yellow-pale) 42%, var(--cream))",
  },
  // 青 — the roast: yellow carried toward fire
  amber: {
    // Russet rather than orange: mixing toward red alone put the chip 28 away from
    // the red family on dark paper, where the warm tokens all lighten and crowd.
    ink: "color-mix(in srgb, var(--yellow-deep) 50%, var(--red-deep))",
    line: "color-mix(in srgb, var(--red) 55%, var(--yellow))",
    chip: "color-mix(in srgb, var(--red) 55%, var(--brown))",
    fill: "color-mix(in srgb, var(--yellow-pale) 22%, color-mix(in srgb, var(--red-pale) 16%, var(--cream)))",
  },
  // 红 — red
  red: {
    ink: "var(--red-deep)",
    line: "var(--red)",
    chip: "var(--red)",
    fill: "color-mix(in srgb, var(--red-pale) 30%, var(--cream))",
  },
  // 黑 — post-fermented: deepest earth
  brown: {
    ink: "var(--brown-soft)",
    line: "var(--brown-soft)",
    chip: "var(--brown)",
    fill: "color-mix(in srgb, var(--brown-pale) 26%, var(--cream))",
  },
};

export const tone = (name) => TONES[name] || TONES.brown;

/**
 * The six traditional Chinese tea categories, in ascending order of oxidation:
 * 绿 green, 白 white, 黄 yellow, 青 oolong, 红 red, 黑 black.
 *
 * `red` is what the West calls "black tea" — Darjeeling, Assam, Keemun — while
 * `black` is post-fermented dark tea: both pu'er processes, liu bao, fu zhuan.
 */
export const FAMILIES = ["green", "white", "yellow", "oolong", "red", "black"];

// Empty while every family's slug reads correctly on its own. Kept because the
// display sites already route through it, so a family needing a prettier label
// (anything with an apostrophe or a space) is a one-line change here.
const FAMILY_LABELS = {};

/** What the reader sees. Falls back to the slug, so most families need no entry. */
export const familyLabel = (f) => FAMILY_LABELS[f] || f;

// One tone each — no two families share a colour.
const FAMILY_TONES = {
  green: "green",
  white: "sage",
  yellow: "yellow",
  oolong: "amber",
  red: "red",
  black: "brown",
};

export function familyTone(f) {
  return FAMILY_TONES[f] || "brown";
}

export const familyAccent = familyTone;
