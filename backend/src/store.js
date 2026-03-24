import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "store.json");

const defaultStore = {
  users: [],
  products: [
    { id: "prod_1", name: "Overlord Rank", category: "Ranks", priceCoins: 1200, active: true, featured: true, description: "Top-tier realm access." },
    { id: "prod_2", name: "Inferno Crate", category: "Crates", priceCoins: 450, active: true, featured: false, description: "High-value cosmetic crate." },
    { id: "prod_3", name: "Nova Key Bundle", category: "Keys", priceCoins: 250, active: true, featured: false, description: "Bundle of premium unlock keys." },
    { id: "prod_4", name: "Blaze Aura Trail", category: "Cosmetics", priceCoins: 320, active: true, featured: false, description: "Molten movement effect." },
    { id: "prod_5", name: "Mythic Rank", category: "Ranks", priceCoins: 800, active: true, featured: false, description: "Elite player recognition." },
    { id: "prod_6", name: "Dragonfire Wings", category: "Cosmetics", priceCoins: 700, active: true, featured: false, description: "Animated wing effect." }
  ],
  coinPackages: [
    { id: "coin_1", name: "Starter Surge", amount: 100, gatewayPrice: 1.99, enabled: true, highlighted: false },
    { id: "coin_2", name: "Pulse Cache", amount: 500, gatewayPrice: 5.0, enabled: true, highlighted: true },
    { id: "coin_3", name: "Inferno Bonus", amount: 1000, gatewayPrice: 9.49, enabled: true, highlighted: false }
  ],
  paymentSettings: {
    methods: {
      paypal: true,
      card: true,
      upi: true
    },
    paypalEmail: "payments@vgrealm.gg",
    upiId: "realm@upi",
    instructions: "Use a supported payment method to buy VG Coins. Store products are purchased only with VG Coins."
  },
  orders: [],
  carts: {}
};

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(defaultStore, null, 2));
  }
}

export function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

export function writeStore(nextStore) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(nextStore, null, 2));
}
