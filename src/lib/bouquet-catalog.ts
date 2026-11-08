export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 680;

export const MIN_ITEM_X = 70;
export const MAX_ITEM_X = 530;
export const MIN_ITEM_Y = 70;
export const MAX_ITEM_Y = 500;
export const MIN_ITEM_SCALE = 0.45;
export const MAX_ITEM_SCALE = 1.85;
export const MIN_ITEM_ROTATION = -180;
export const MAX_ITEM_ROTATION = 180;
export const MIN_ITEM_Z = 0;
export const MAX_ITEM_Z = 99;
export const MAX_BOUQUET_ITEMS = 25;

export const FLOWER_TYPES = [
  "rose",
  "tulip",
  "sunflower",
  "daisy",
  "lily",
  "peony",
  "lavender",
  "babys_breath",
  "hydrangea",
  "ranunculus",
  "chamomile",
  "orchid",
] as const;

export const GREENERY_TYPES = [
  "eucalyptus",
  "fern",
  "ruscus",
  "olive_branch",
  "monstera_mini",
  "ivy_trail",
  "dusty_miller",
] as const;

export const ALL_ELEMENT_TYPES = [...FLOWER_TYPES, ...GREENERY_TYPES] as const;

export const PAPER_TYPES = [
  "blush_pink",
  "warm_cream",
  "sage_green",
  "soft_lavender",
  "butter_yellow",
  "sky_mist",
] as const;

export const RIBBON_TYPES = [
  "satin_rose",
  "velvet_burgundy",
  "twine_rustic",
  "organza_cream",
  "sage_gingham",
] as const;

export type FlowerType = (typeof FLOWER_TYPES)[number];
export type GreeneryType = (typeof GREENERY_TYPES)[number];
export type BouquetElementType = (typeof ALL_ELEMENT_TYPES)[number];
export type PaperType = (typeof PAPER_TYPES)[number];
export type RibbonType = (typeof RIBBON_TYPES)[number];

export interface BouquetItem {
  type: BouquetElementType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z: number;
}

export interface BouquetJson {
  version: 1;
  paper: PaperType;
  ribbon: RibbonType;
  items: BouquetItem[];
}

export interface CatalogElementMeta {
  id: BouquetElementType;
  name: string;
  category: "flower" | "greenery";
  meaning: string;
  defaultScale: number;
  accentColor: string;
}

export interface PaperStyleMeta {
  id: PaperType;
  name: string;
  backFill: string;
  frontFill: string;
  innerFoldFill: string;
  stroke: string;
  pattern: "dots" | "linen" | "stripes" | "gingham" | "plain";
}

export interface RibbonStyleMeta {
  id: RibbonType;
  name: string;
  primary: string;
  secondary: string;
  stroke: string;
}

export const CATALOG_ELEMENTS: readonly CatalogElementMeta[] = [
  // 12 Original Flowers
  {
    id: "rose",
    name: "Mawar Blush",
    category: "flower",
    meaning: "Rasa sayang yang tulus",
    defaultScale: 1.0,
    accentColor: "#F4A4B8",
  },
  {
    id: "tulip",
    name: "Tulip Koral",
    category: "flower",
    meaning: "Perhatian hangat",
    defaultScale: 1.0,
    accentColor: "#F6A692",
  },
  {
    id: "sunflower",
    name: "Bunga Matahari",
    category: "flower",
    meaning: "Penyemangat hari",
    defaultScale: 1.08,
    accentColor: "#F7CE68",
  },
  {
    id: "daisy",
    name: "Aster Putih",
    category: "flower",
    meaning: "Ketulusan sederhana",
    defaultScale: 0.95,
    accentColor: "#FFF5D6",
  },
  {
    id: "lily",
    name: "Lili Merah Jambu",
    category: "flower",
    meaning: "Kekaguman diam-diam",
    defaultScale: 1.08,
    accentColor: "#F5B5CA",
  },
  {
    id: "peony",
    name: "Peony Manis",
    category: "flower",
    meaning: "Doa kebahagiaan",
    defaultScale: 1.1,
    accentColor: "#F8BFD0",
  },
  {
    id: "lavender",
    name: "Lavender Ungu",
    category: "flower",
    meaning: "Ketenangan hati",
    defaultScale: 1.0,
    accentColor: "#BBA4E3",
  },
  {
    id: "babys_breath",
    name: "Baby's Breath",
    category: "flower",
    meaning: "Kenangan lembut",
    defaultScale: 1.0,
    accentColor: "#F4F2EE",
  },
  {
    id: "hydrangea",
    name: "Hortensia Biru",
    category: "flower",
    meaning: "Rasa terima kasih",
    defaultScale: 1.12,
    accentColor: "#B7CEF2",
  },
  {
    id: "ranunculus",
    name: "Ranunculus Persik",
    category: "flower",
    meaning: "Pesona yang memikat",
    defaultScale: 0.98,
    accentColor: "#FAC5A8",
  },
  {
    id: "chamomile",
    name: "Kamomil Mungil",
    category: "flower",
    meaning: "Harapan baik",
    defaultScale: 0.92,
    accentColor: "#FBE59B",
  },
  {
    id: "orchid",
    name: "Anggrek Bulan",
    category: "flower",
    meaning: "Keanggunan istimewa",
    defaultScale: 1.04,
    accentColor: "#DFB8E8",
  },
  // 7 Original Greenery / Filler Leaves
  {
    id: "eucalyptus",
    name: "Daun Eukaliptus",
    category: "greenery",
    meaning: "Pelengkap sejuk",
    defaultScale: 1.08,
    accentColor: "#9DC0A8",
  },
  {
    id: "fern",
    name: "Pakis Lembut",
    category: "greenery",
    meaning: "Ketulusan alami",
    defaultScale: 1.1,
    accentColor: "#8DB88E",
  },
  {
    id: "ruscus",
    name: "Ranting Ruscus",
    category: "greenery",
    meaning: "Kesegaran hijau",
    defaultScale: 1.05,
    accentColor: "#7EA982",
  },
  {
    id: "olive_branch",
    name: "Ranting Zaitun",
    category: "greenery",
    meaning: "Kedamaian",
    defaultScale: 1.06,
    accentColor: "#A5B88C",
  },
  {
    id: "monstera_mini",
    name: "Daun Monstera",
    category: "greenery",
    meaning: "Nuansa tropis",
    defaultScale: 1.05,
    accentColor: "#87B694",
  },
  {
    id: "ivy_trail",
    name: "Sulur Ivy",
    category: "greenery",
    meaning: "Persahabatan hangat",
    defaultScale: 1.0,
    accentColor: "#92BC9A",
  },
  {
    id: "dusty_miller",
    name: "Dusty Miller",
    category: "greenery",
    meaning: "Sentuhan beludru",
    defaultScale: 1.04,
    accentColor: "#C5D4CA",
  },
] as const;

export const PAPER_STYLES: readonly PaperStyleMeta[] = [
  {
    id: "blush_pink",
    name: "Kertas Blush Pink",
    backFill: "#F8D7E0",
    frontFill: "#FCE6EC",
    innerFoldFill: "#FFF4F7",
    stroke: "#E5B4C2",
    pattern: "dots",
  },
  {
    id: "warm_cream",
    name: "Kertas Kraft Krem",
    backFill: "#EFE0CC",
    frontFill: "#F8EFE2",
    innerFoldFill: "#FFFDF8",
    stroke: "#D7C2A8",
    pattern: "linen",
  },
  {
    id: "sage_green",
    name: "Kertas Hijau Sage",
    backFill: "#CFE0D1",
    frontFill: "#E3EFE4",
    innerFoldFill: "#F4F9F4",
    stroke: "#AECCB1",
    pattern: "stripes",
  },
  {
    id: "soft_lavender",
    name: "Kertas Lavender",
    backFill: "#DDD3F0",
    frontFill: "#ECE6F8",
    innerFoldFill: "#F8F5FD",
    stroke: "#C0B1DF",
    pattern: "gingham",
  },
  {
    id: "butter_yellow",
    name: "Kertas Kuning Mentega",
    backFill: "#F5E5B8",
    frontFill: "#FCF2D4",
    innerFoldFill: "#FFFBEF",
    stroke: "#DFCA93",
    pattern: "plain",
  },
  {
    id: "sky_mist",
    name: "Kertas Biru Awan",
    backFill: "#CFE1F2",
    frontFill: "#E4EFFA",
    innerFoldFill: "#F5FAFF",
    stroke: "#ACC7E0",
    pattern: "dots",
  },
] as const;

export const RIBBON_STYLES: readonly RibbonStyleMeta[] = [
  {
    id: "satin_rose",
    name: "Pita Satin Rose",
    primary: "#E66C8C",
    secondary: "#F596B0",
    stroke: "#C24B6B",
  },
  {
    id: "velvet_burgundy",
    name: "Pita Beludru Berry",
    primary: "#9F3B5B",
    secondary: "#BF5677",
    stroke: "#78243F",
  },
  {
    id: "twine_rustic",
    name: "Tali Rami Klasik",
    primary: "#C29B6F",
    secondary: "#D8B68E",
    stroke: "#9A744B",
  },
  {
    id: "organza_cream",
    name: "Pita Organza Krem",
    primary: "#F7ECDC",
    secondary: "#FFF9F0",
    stroke: "#D2BEA2",
  },
  {
    id: "sage_gingham",
    name: "Pita Sage Manis",
    primary: "#74A17B",
    secondary: "#97C09D",
    stroke: "#547B5A",
  },
] as const;

export function getElementMeta(type: BouquetElementType): CatalogElementMeta {
  const found = CATALOG_ELEMENTS.find((item) => item.id === type);
  return found ?? CATALOG_ELEMENTS[0]!;
}

export function getPaperMeta(id: PaperType): PaperStyleMeta {
  const found = PAPER_STYLES.find((paper) => paper.id === id);
  return found ?? PAPER_STYLES[0]!;
}

export function getRibbonMeta(id: RibbonType): RibbonStyleMeta {
  const found = RIBBON_STYLES.find((ribbon) => ribbon.id === id);
  return found ?? RIBBON_STYLES[0]!;
}

export function createStarterBouquet(): BouquetJson {
  return {
    version: 1,
    paper: "blush_pink",
    ribbon: "satin_rose",
    items: [
      { type: "eucalyptus", x: 215, y: 215, scale: 1.12, rotation: -26, z: 0 },
      { type: "fern", x: 388, y: 215, scale: 1.12, rotation: 26, z: 1 },
      { type: "olive_branch", x: 300, y: 185, scale: 1.08, rotation: 2, z: 2 },
      { type: "babys_breath", x: 225, y: 278, scale: 0.96, rotation: -18, z: 3 },
      { type: "babys_breath", x: 378, y: 274, scale: 0.96, rotation: 18, z: 4 },
      { type: "peony", x: 252, y: 246, scale: 1.08, rotation: -10, z: 5 },
      { type: "tulip", x: 352, y: 242, scale: 1.02, rotation: 12, z: 6 },
      { type: "rose", x: 302, y: 272, scale: 1.14, rotation: 0, z: 7 },
      { type: "daisy", x: 248, y: 312, scale: 0.92, rotation: -12, z: 8 },
      { type: "chamomile", x: 354, y: 312, scale: 0.92, rotation: 10, z: 9 },
    ],
  };
}

function pickRandom<T>(list: readonly T[]): T {
  const idx = Math.floor(Math.random() * list.length);
  return list[idx]!;
}

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

/**
 * Generates an aesthetically balanced randomized bouquet arrangement ("Acak").
 */
export function createRandomizedBouquet(): BouquetJson {
  const paper = pickRandom(PAPER_TYPES);
  const ribbon = pickRandom(RIBBON_TYPES);
  const items: BouquetItem[] = [];
  let z = 0;

  // Back foliage fan (4-5 greenery stems)
  const greeneryCount = 4 + Math.floor(Math.random() * 2);
  for (let i = 0; i < greeneryCount; i++) {
    const progress = greeneryCount === 1 ? 0.5 : i / (greeneryCount - 1);
    const angle = -32 + progress * 64 + randomBetween(-5, 5);
    const x = Math.round(195 + progress * 210 + randomBetween(-14, 14));
    const y = Math.round(195 + Math.abs(progress - 0.5) * 65 + randomBetween(-14, 14));
    items.push({
      type: pickRandom(GREENERY_TYPES),
      x,
      y,
      scale: randomBetween(0.98, 1.22),
      rotation: Math.round(angle),
      z: z++,
    });
  }

  // Mid & front flowers (6-8 blooms arranged in two natural arcs)
  const focalFlowers: readonly FlowerType[] = [
    "rose",
    "peony",
    "sunflower",
    "hydrangea",
    "lily",
    "ranunculus",
    "orchid",
    "tulip",
  ];
  const accentFlowers: readonly FlowerType[] = [
    "daisy",
    "lavender",
    "babys_breath",
    "chamomile",
    "tulip",
  ];

  const upperCount = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < upperCount; i++) {
    const progress = upperCount === 1 ? 0.5 : i / (upperCount - 1);
    items.push({
      type: pickRandom(focalFlowers),
      x: Math.round(220 + progress * 160 + randomBetween(-12, 12)),
      y: Math.round(220 + Math.abs(progress - 0.5) * 42 + randomBetween(-10, 12)),
      scale: randomBetween(0.95, 1.16),
      rotation: Math.round(-18 + progress * 36 + randomBetween(-6, 6)),
      z: z++,
    });
  }

  const lowerCount = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < lowerCount; i++) {
    const progress = lowerCount === 1 ? 0.5 : i / (lowerCount - 1);
    const pool = i % 2 === 0 ? accentFlowers : focalFlowers;
    items.push({
      type: pickRandom(pool),
      x: Math.round(230 + progress * 140 + randomBetween(-12, 12)),
      y: Math.round(288 + Math.abs(progress - 0.5) * 28 + randomBetween(-10, 10)),
      scale: randomBetween(0.88, 1.12),
      rotation: Math.round(-15 + progress * 30 + randomBetween(-8, 8)),
      z: z++,
    });
  }

  return {
    version: 1,
    paper,
    ribbon,
    items,
  };
}
