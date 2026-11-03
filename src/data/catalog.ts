export type CatalogItem = {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  currency: "USD";
  description: string;
  tags: string[];
  imageEmoji: string;
};

export const CATALOG: CatalogItem[] = [
  {
    id: "sku-coffee-pods",
    name: "Espresso Coffee Pods (24ct)",
    category: "Grocery",
    brand: "Northbridge Pantry",
    price: 18.99,
    currency: "USD",
    description: "Dark roast pods compatible with major machines.",
    tags: ["coffee", "pods", "breakfast", "kitchen"],
    imageEmoji: "☕",
  },
  {
    id: "sku-oat-milk",
    name: "Barista Oat Milk (6-pack)",
    category: "Grocery",
    brand: "Northbridge Pantry",
    price: 14.5,
    currency: "USD",
    description: "Creamy oat milk for lattes.",
    tags: ["oat", "milk", "coffee", "dairy-free"],
    imageEmoji: "🥛",
  },
  {
    id: "sku-filters",
    name: "Reusable Coffee Filters (2-pack)",
    category: "Kitchen",
    brand: "BrewKeep",
    price: 12.0,
    currency: "USD",
    description: "Washable metal mesh filters.",
    tags: ["coffee", "filter", "kitchen", "eco"],
    imageEmoji: "🧰",
  },
  {
    id: "sku-headphones",
    name: "Wireless ANC Headphones",
    category: "Electronics",
    brand: "SignalNest",
    price: 129.0,
    currency: "USD",
    description: "Over-ear headphones with active noise canceling.",
    tags: ["headphones", "audio", "electronics", "gift"],
    imageEmoji: "🎧",
  },
  {
    id: "sku-usb-c-hub",
    name: "USB-C Hub 7-in-1",
    category: "Electronics",
    brand: "SignalNest",
    price: 49.99,
    currency: "USD",
    description: "HDMI, SD, USB-A, and PD passthrough.",
    tags: ["usb", "hub", "laptop", "electronics"],
    imageEmoji: "🔌",
  },
  {
    id: "sku-desk-lamp",
    name: "Adjustable LED Desk Lamp",
    category: "Home",
    brand: "LumenDesk",
    price: 39.0,
    currency: "USD",
    description: "Warm/cool modes with USB charging port.",
    tags: ["lamp", "desk", "home", "office"],
    imageEmoji: "💡",
  },
  {
    id: "sku-notebook",
    name: "Hardcover Notebook Duo",
    category: "Office",
    brand: "Paperlane",
    price: 16.0,
    currency: "USD",
    description: "Two A5 dotted notebooks.",
    tags: ["notebook", "stationery", "office"],
    imageEmoji: "📓",
  },
  {
    id: "sku-tea-set",
    name: "Herbal Tea Sampler (12 blends)",
    category: "Grocery",
    brand: "Northbridge Pantry",
    price: 22.5,
    currency: "USD",
    description: "Caffeine-free evening sampler.",
    tags: ["tea", "herbal", "gift", "grocery"],
    imageEmoji: "🍵",
  },
  {
    id: "sku-running-socks",
    name: "Performance Running Socks (3-pack)",
    category: "Apparel",
    brand: "TrailForm",
    price: 24.0,
    currency: "USD",
    description: "Moisture-wicking cushioned socks.",
    tags: ["socks", "running", "apparel", "fitness"],
    imageEmoji: "🧦",
  },
  {
    id: "sku-protein",
    name: "Plant Protein Powder (Vanilla)",
    category: "Grocery",
    brand: "FuelLine",
    price: 34.99,
    currency: "USD",
    description: "20g protein per serving, 15 servings.",
    tags: ["protein", "fitness", "grocery", "vanilla"],
    imageEmoji: "🥤",
  },
  {
    id: "sku-monitor-arm",
    name: "Single Monitor Arm",
    category: "Office",
    brand: "LumenDesk",
    price: 59.0,
    currency: "USD",
    description: "Gas-spring arm for 17–32\" displays.",
    tags: ["monitor", "desk", "office", "ergonomics"],
    imageEmoji: "🖥️",
  },
  {
    id: "sku-gift-card",
    name: "Northbridge Gift Card $25",
    category: "Gift",
    brand: "Northbridge",
    price: 25.0,
    currency: "USD",
    description: "Digital gift card for any catalog item.",
    tags: ["gift", "card", "digital"],
    imageEmoji: "🎁",
  },
];

export function findById(id: string) {
  return CATALOG.find((i) => i.id === id);
}
