// Example content, offered once when the database is empty.
//
// Per the brief this is placeholder: one tea rather than the design kit's eight,
// and the guide/exploration entries kept only as worked examples of every block
// kind. Delete any of it from inside the app.

import { teas, guideBlocks, glossary, researchItems } from "./db.js";
import { keysAfter } from "./frac.js";
import { supabase } from "./supabase.js";

const TEA = {
  name: "Da Hong Pao",
  kanji: "大红袍",
  family: "oolong",
  region: "Wuyi, Fujian",
  country: "China",
  cultivar: "Bei Dou",
  form: "loose leaf",
  harvest: "2023-05-04",
  steep: "95°C · 0:20",
  tags: ["rock rhyme", "roasted", "cliff"],
  notes: "A wet-stone rock, a fire long banked. Somewhere in it, an orchid opening at night.",
  journal: [
    "Drank it in the rain with the window open. Mineral answers mineral.",
    "Third steep is where the orchid lives. Everything before is fire.",
    "Note to self: stop rinsing it twice.",
  ],
};

// [kind, span, height, content]
const GUIDE = [
  ["heading", 4, 0, { label: "tools" }],
  ["entry", 1, 260, {
    category: "tool",
    name: "Gaiwan", kanji: "蓋碗", tone: "green",
    blurb: "A lidded bowl. The most honest vessel there is — nothing to hide behind, nothing to keep the heat.",
    specs: [["volume", "100–150ml"], ["material", "porcelain"], ["best for", "oolong, white, green"]],
    body: [
      "Three pieces: bowl, lid, saucer. The lid does the straining, tilted against the rim so leaf stays behind and liquor runs out in a thin sheet. It takes a scalded thumb or two to learn the angle.",
      "Porcelain holds no flavour, which is why the gaiwan is the tasting vessel. If you want to know what a leaf actually tastes like, brew it here first and clay it later.",
    ],
    bullets: [
      "Warm the bowl before the leaf goes in.",
      "Fill high, close to the rim — the lid should sit on water, not air.",
      "Pour out completely. A gaiwan left half full keeps stewing.",
    ],
  }],
  ["entry", 1, 260, {
    category: "tool",
    name: "Kettle", kanji: "水注", tone: "brown",
    blurb: "Water is the mother of tea. Everything downstream of the kettle is correction.",
    specs: [["ideal", "variable temp"], ["spout", "gooseneck"], ["capacity", "0.8–1.2L"]],
    body: [
      "A gooseneck gives you a slow, aimed stream — useful for green tea, where a hard pour bruises the leaf, and for pu-erh, where you want to drive water through a compressed cake.",
      "Reboiled water tastes flat. It has lost the dissolved air that carries aroma, and no amount of leaf brings it back. Fill fresh each time.",
    ],
    bullets: [
      "Fish eyes: ~75°C, small bubbles on the base — green and gyokuro.",
      "String of pearls: ~85°C, rising chains — white and light oolong.",
      "Raging torrent: full boil — roasted oolong, black, dark tea.",
    ],
  }],
  ["entry", 1, 260, {
    category: "tool",
    name: "Scale", kanji: "秤", tone: "yellow",
    blurb: "Ratio is the only variable most people never measure, and the one that changes everything.",
    specs: [["resolution", "0.1g"], ["baseline", "5g / 100ml"], ["cost", "unavoidable"]],
    body: [
      "A teaspoon is a volume, and leaf comes in a hundred densities. Two grams of silver needle fills a bowl; two grams of gunpowder rattles in the bottom of it. Weigh, and your notes start meaning something.",
    ],
    bullets: [
      "Western style: 2–3g / 200ml, one long steep.",
      "Gongfu: 5–7g / 100ml, many short ones.",
      "Grandpa style: a pinch in a tall glass, topped up all day.",
    ],
  }],
  ["entry", 1, 260, {
    category: "tool",
    name: "Cha Hai", kanji: "茶海", tone: "red",
    blurb: "The fairness pitcher. Pour into it, then into cups, so every cup is the same cup.",
    specs: [["also called", "gong dao bei"], ["volume", "match the pot"], ["material", "glass"]],
    body: [
      "Liquor at the bottom of a pot is stronger than liquor at the top. Decant everything into one pitcher, swirl once, and the difference disappears. Glass also lets you read the colour, which is half of what tells you the steep was right.",
    ],
    bullets: [],
  }],
  ["trivia", 2, 170, {
    title: "trivia",
    text: "All six tea types come from one plant, Camellia sinensis. The differences are entirely processing.",
  }],
  ["illustration", 2, 190, { label: "illustration · the six tea types, one leaf" }],
  ["heading", 4, 0, { label: "techniques" }],
  ["entry", 1, 260, {
    category: "technique",
    name: "Gongfu brewing", kanji: "工夫茶", tone: "red",
    blurb: "High leaf, small water, short steeps. The leaf is asked the same question eight times and answers differently each time.",
    specs: [["ratio", "5–7g / 100ml"], ["first steep", "10–20s"], ["steeps", "6–10"]],
    body: [
      "The idea is not strength but resolution. A single four-minute steep averages the whole leaf into one flavour; ten short ones let you watch it open, peak, and fade. Most oolongs hit their best cup on the third.",
      "Add a few seconds each round. When the additions stop helping, the leaf is finished — and that point is worth writing down, because it is a property of the tea.",
    ],
    bullets: [
      "Rinse compressed and roasted teas once, quickly. Discard it.",
      "Steep 1 short — you are measuring, not drinking.",
      "Extend by 5s a round; by round six, by 15s.",
      "Smell the wet leaf between pours. It changes faster than the liquor.",
    ],
  }],
  ["entry", 1, 260, {
    category: "technique",
    name: "Cold brew", kanji: "冷泡", tone: "green",
    blurb: "Time instead of heat. Sweetness without any of the bitterness heat pulls out.",
    specs: [["ratio", "1g / 100ml"], ["time", "6–12h"], ["place", "refrigerator"]],
    body: [
      "Cold water extracts amino acids and sugars readily but leaves most tannin and caffeine in the leaf. The result is rounder and sweeter than the same tea hot, and almost impossible to ruin by forgetting it.",
      "Green tea, white tea, and light oolong take to it best. Roasted and dark teas turn muddy.",
    ],
    bullets: [
      "Leaf and cold water in a bottle. No steeping vessel needed.",
      "Overnight is the rule of thumb; twelve hours is the ceiling.",
      "Strain when you drink it, not before.",
    ],
  }],
  ["entry", 1, 260, {
    category: "technique",
    name: "Roasting", kanji: "焙火", tone: "yellow",
    blurb: "Charcoal, low and slow, sometimes over years. It changes a tea's character more than any other hand laid on it.",
    specs: [["temp", "80–120°C"], ["passes", "1–5"], ["rest", "weeks to months"]],
    body: [
      "Roasting drives off moisture and caramelises sugars in the leaf. A green oolong becomes toast and stone fruit; hōjicha, a green tea roasted hard, loses nearly all its grass and reads as chestnut and warm paper.",
      "Freshly roasted tea tastes of fire and little else. It needs to rest — a month at minimum — before the roast settles back into the leaf.",
    ],
    bullets: [
      "Light roast keeps florals, adds body.",
      "Medium roast trades flowers for fruit and nuts.",
      "Heavy roast is about texture and warmth, not aroma.",
    ],
  }],
  ["note", 2, 250, {
    title: "reading the water",
    items: [
      "Filtered, never distilled. Tea needs some mineral to taste of anything.",
      "Boil once. Reboiled water has lost its air and tastes flat.",
      "Warm every vessel first, or the first steep runs cold.",
      "Pour out completely. Leaf left sitting in water keeps brewing.",
    ],
  }],
  ["trivia", 2, 250, {
    title: "trivia",
    text: "Tea and coffee both contain caffeine, but tea also carries L-theanine, which is why the same dose feels calmer.",
  }],
  ["trivia", 4, 170, {
    title: "trivia",
    text: "A pu-erh cake is pressed at 357g — seven cakes to a tong, twelve tong to a horse load, from the old caravan trade.",
  }],
];

const GLOSSARY = [
  ["gongfu", "Literally skill or effort. A brewing approach using high leaf ratio and many short steeps."],
  ["oxidation", "The enzymatic browning of bruised leaf. The single axis that separates green from oolong from black."],
  ["first flush", "The season's first plucking, after dormancy. Lighter, more aromatic, more expensive."],
  ["huigan", "The returning sweetness felt in the throat after swallowing, sometimes minutes later."],
  ["shou / sheng", "Ripened and raw pu-erh. Shou is fermented in piles over months; sheng ages slowly in air."],
  ["cha qi", "The bodily feeling a tea leaves behind, distinct from its taste. Disputed, and widely reported."],
  ["mouthfeel", "Texture rather than flavour — thin, oily, creamy, drying, coating."],
  ["wet leaf", "The spent leaf after a steep. Read its aroma; it tells you more than the cup does."],
];

const RESEARCH = [
  {
    title: "Roast, rest, and the month that fixes it",
    tone: "yellow",
    topics: [["Da Hong Pao", "tea"], ["Tie Guan Yin", "tea"], ["Maillard products", "compound"], ["pyrazines", "compound"]],
    description:
      "Freshly roasted oolong tastes of fire and nothing else, and then a month later it does not. I want to know what settles, and whether the resting period is chemistry or evaporation.",
    findings: [
      "Charcoal roasting drives Maillard reactions between amino acids and sugars in the leaf, producing pyrazines and furans — the compounds responsible for the toast, nut, and caramel notes that separate a roasted oolong from a green one.",
      "The immediate post-roast harshness is generally attributed to volatile aldehydes and residual moisture redistribution rather than to the Maillard products themselves. Resting allows the volatiles to dissipate and moisture to equalise through the leaf. This is the part of the literature I find least satisfying: it is described more often than it is measured.",
      "In practice, the difference between a one-week and a six-week rest on the same Wuyi leaf is not subtle. The roast moves from the front of the palate to the back and stops competing with the tea underneath it.",
    ],
    biblio: [
      { authors: "Yang, Z., Baldermann, S., Watanabe, N.", title: "Recent studies of the volatile compounds in tea", year: "2013", where: "Food Research International" },
      { authors: "Wang, L.-F., Lee, J.-Y., Chung, J.-O. et al.", title: "Discrimination of teas with different degrees of fermentation by SPME–GC analysis", year: "2008", where: "Food Chemistry" },
    ],
    log: [
      { note: "Bought the Bei Dou two weeks after roasting, which was a mistake I will not repeat. Undrinkable for a month." },
      { note: "Same leaf, six weeks later. The orchid is back and the fire has moved behind it." },
      { ref: 0, note: "Yang et al. list pyrazine formation as temperature-dependent above roughly 100°C. A light roast should therefore be almost pyrazine-free — which matches how a green TGY tastes: floral, no toast at all." },
    ],
  },
  {
    title: "What is actually alive in a shou pile",
    tone: "red",
    topics: [["shou pu-erh", "tea"], ["Aspergillus niger", "microbe"], ["Blastobotrys", "microbe"], ["gallic acid", "compound"]],
    description:
      "Wet-piling is a fermentation with a named cast of organisms, and almost nobody selling the tea can tell you which ones. I have been reading the microbiology to find out what I am drinking.",
    findings: [
      "Shou pu-erh is produced by wo dui — piling damp leaf under cloth for forty to sixty days while microbial activity raises the temperature to 55–65°C. Unlike sheng, which changes slowly through oxidation and slow microbial action over years, shou is a directed process with a defined endpoint.",
      "Sequencing studies consistently find Aspergillus species dominating the fungal community, with yeasts of the Blastobotrys genus appearing in the later, hotter stages. Bacterial populations are more variable between factories, which is likely why two shou cakes from the same year and region can taste unrelated.",
      "The chemical signature of the process is a sharp rise in gallic acid and a collapse in catechin content. That is the whole difference in the cup: the astringency leaves, and what remains reads as earth, bark, and dark sweetness.",
    ],
    biblio: [
      { authors: "Zhang, W., Yang, R., Fang, W. et al.", title: "Characterization of thermophilic fungal community associated with pile fermentation of pu-erh tea", year: "2016", where: "International Journal of Food Microbiology" },
      { authors: "Lv, H., Zhang, Y., Lin, Z., Liang, Y.", title: "Processing and chemical constituents of pu-erh tea: a review", year: "2013", where: "Food Research International" },
      { authors: "Abe, M., Takaoka, N., Idemoto, Y. et al.", title: "Characteristic fungi observed in the fermentation process for pu-erh tea", year: "2008", where: "International Journal of Food Microbiology" },
    ],
    log: [
      { ref: 0, note: "Zhang et al. put the pile peak at 55–65°C. That is hot enough to exclude most of what starts the fermentation — the community that finishes it is not the community that begins it." },
      { note: "Tasted a 2011 Menghai cake alongside this. Reads like the description of a high-Aspergillus profile. This is not evidence. Writing it down anyway." },
      { ref: 1, note: "Lv et al., on gallic acid rising as catechins fall: this is the cleanest chemical explanation I have found for why aged shou has no astringency left to give." },
    ],
  },
];

/** True when the account has no content at all. */
export async function isEmpty() {
  const [t, g, r] = await Promise.all([teas.list(), guideBlocks.list(), researchItems.list()]);
  return t.length === 0 && g.length === 0 && r.length === 0;
}

export async function seedExample() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("not signed in");

  await teas.create(TEA, { list: [] });

  // Positions are generated up front so the blocks land in the authored order.
  const guideKeys = keysAfter(null, GUIDE.length);
  await guideBlocks.insertMany(GUIDE.map(([kind, span, height, content], i) => ({ kind, span, height, content, position: guideKeys[i] })));

  const glossKeys = keysAfter(null, GLOSSARY.length);
  await supabase
    .from("glossary_terms")
    .insert(GLOSSARY.map(([term, definition], i) => ({ term, definition, position: glossKeys[i] })))
    .throwOnError();

  const researchKeys = keysAfter(null, RESEARCH.length);
  await supabase
    .from("research_items")
    .insert(RESEARCH.map((r, i) => ({ ...r, position: researchKeys[i] })))
    .throwOnError();
}
