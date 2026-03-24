const pool = require("./db");
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { readStore, writeStore } from "./store.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || "change-this-secret";

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || true, credentials: true }));
app.use(express.json());

function signToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    req.auth = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function adminRequired(req, res, next) {
  if (!req.auth?.isAdmin) return res.status(403).json({ error: "Admin access required" });
  next();
}

function publicUser(user) {
  return {
    id: user.id,
    minecraftUsername: user.minecraftUsername,
    email: user.email,
    coins: user.coins,
    banned: Boolean(user.banned)
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  const { minecraftUsername, email, password } = req.body || {};
  if (!minecraftUsername || !email || !password) {
    return res.status(400).json({ error: "minecraftUsername, email, and password are required" });
  }

  const store = readStore();
  const normalizedEmail = String(email).trim().toLowerCase();
  if (store.users.some((user) => user.email === normalizedEmail)) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = {
    id: nanoid(12),
    minecraftUsername: String(minecraftUsername).trim(),
    email: normalizedEmail,
    passwordHash,
    coins: 500,
    banned: false
  };

  store.users.push(user);
  store.carts[user.id] = [];
  writeStore(store);

  const token = signToken({ sub: user.id, isAdmin: false });
  res.status(201).json({ token, user: publicUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (
    normalizedEmail === String(process.env.ADMIN_EMAIL || "admin@vgrealm.gg").toLowerCase() &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = signToken({ sub: "admin", isAdmin: true });
    return res.json({
      token,
      admin: { email: normalizedEmail }
    });
  }

  const store = readStore();
  const user = store.users.find((entry) => entry.email === normalizedEmail);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  if (user.banned) return res.status(403).json({ error: "User is banned" });

  const valid = await bcrypt.compare(String(password || ""), user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ sub: user.id, isAdmin: false });
  res.json({ token, user: publicUser(user) });
});

app.get("/api/me", authRequired, (req, res) => {
  if (req.auth.isAdmin) {
    return res.json({ admin: true, email: process.env.ADMIN_EMAIL || "admin@vgrealm.gg" });
  }

  const store = readStore();
  const user = store.users.find((entry) => entry.id === req.auth.sub);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

app.get("/api/products", (_req, res) => {
  const store = readStore();
  res.json({ products: store.products.filter((product) => product.active) });
});

app.get("/api/admin/products", authRequired, adminRequired, (_req, res) => {
  const store = readStore();
  res.json({ products: store.products });
});

app.put("/api/admin/products", authRequired, adminRequired, (req, res) => {
  const { products } = req.body || {};
  if (!Array.isArray(products)) return res.status(400).json({ error: "products must be an array" });
  const store = readStore();
  store.products = products;
  writeStore(store);
  res.json({ products: store.products });
});

app.get("/api/coin-packages", (_req, res) => {
  const store = readStore();
  res.json({
    coinPackages: store.coinPackages.filter((pack) => pack.enabled),
    paymentSettings: store.paymentSettings
  });
});

app.get("/api/cart", authRequired, (req, res) => {
  if (req.auth.isAdmin) return res.status(400).json({ error: "Admins do not have carts" });
  const store = readStore();
  res.json({ cart: store.carts[req.auth.sub] || [] });
});

app.post("/api/cart/items", authRequired, (req, res) => {
  if (req.auth.isAdmin) return res.status(400).json({ error: "Admins do not have carts" });
  const { productId, quantity = 1 } = req.body || {};
  const store = readStore();
  const product = store.products.find((entry) => entry.id === productId && entry.active);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const cart = store.carts[req.auth.sub] || [];
  const existing = cart.find((item) => item.productId === productId);
  if (existing) existing.quantity += Number(quantity) || 1;
  else cart.push({ productId, quantity: Number(quantity) || 1 });
  store.carts[req.auth.sub] = cart;
  writeStore(store);
  res.status(201).json({ cart });
});

app.patch("/api/cart/items/:productId", authRequired, (req, res) => {
  const { quantity } = req.body || {};
  const store = readStore();
  const cart = store.carts[req.auth.sub] || [];
  const item = cart.find((entry) => entry.productId === req.params.productId);
  if (!item) return res.status(404).json({ error: "Cart item not found" });
  item.quantity = Math.max(1, Number(quantity) || 1);
  writeStore(store);
  res.json({ cart });
});

app.delete("/api/cart/items/:productId", authRequired, (req, res) => {
  const store = readStore();
  const cart = (store.carts[req.auth.sub] || []).filter((entry) => entry.productId !== req.params.productId);
  store.carts[req.auth.sub] = cart;
  writeStore(store);
  res.json({ cart });
});

app.post("/api/coins/top-up", authRequired, (req, res) => {
  if (req.auth.isAdmin) return res.status(400).json({ error: "Admins cannot top up coins" });
  const { packageId, paymentMethod, proofName, proofImage } = req.body || {};
  const store = readStore();
  const coinPackage = store.coinPackages.find((entry) => entry.id === packageId && entry.enabled);
  if (!coinPackage) return res.status(404).json({ error: "Coin package not found" });
  if (!store.paymentSettings.methods[paymentMethod]) {
    return res.status(400).json({ error: "Payment method disabled" });
  }
  if (!proofName || !proofImage) {
    return res.status(400).json({ error: "Payment screenshot is required" });
  }

  const user = store.users.find((entry) => entry.id === req.auth.sub);
  if (!user) return res.status(404).json({ error: "User not found" });

  store.orders.unshift({
    id: `ORD-${Date.now()}`,
    userId: user.id,
    user: user.minecraftUsername,
    products: [`${coinPackage.name} Top-Up`],
    totalCoins: coinPackage.amount,
    paymentMethod,
    paymentStatus: "Proof Submitted",
    orderStatus: "Pending",
    type: "coin_topup",
    credited: false,
    proofName: String(proofName),
    proofImage: String(proofImage),
    notes: "Payment proof uploaded by user.",
    createdAt: new Date().toISOString()
  });
  writeStore(store);
  res.status(201).json({ message: "Payment proof submitted. Admin review pending.", user: publicUser(user) });
});

app.post("/api/checkout/coins", authRequired, (req, res) => {
  if (req.auth.isAdmin) return res.status(400).json({ error: "Admins cannot checkout products" });
  const store = readStore();
  const user = store.users.find((entry) => entry.id === req.auth.sub);
  if (!user) return res.status(404).json({ error: "User not found" });

  const cart = store.carts[user.id] || [];
  if (!cart.length) return res.status(400).json({ error: "Cart is empty" });

  const products = cart.map((item) => {
    const product = store.products.find((entry) => entry.id === item.productId && entry.active);
    return product ? { ...product, quantity: item.quantity } : null;
  }).filter(Boolean);

  const totalCoins = products.reduce((sum, product) => sum + product.priceCoins * product.quantity, 0);
  if (user.coins < totalCoins) {
    return res.status(400).json({ error: "Insufficient VG Coins", required: totalCoins, balance: user.coins });
  }

  user.coins -= totalCoins;
  store.carts[user.id] = [];
  store.orders.unshift({
    id: `ORD-${Date.now()}`,
    userId: user.id,
    user: user.minecraftUsername,
    products: products.map((product) => `${product.name} x${product.quantity}`),
    totalCoins,
    paymentMethod: "VG Coins",
    paymentStatus: "Paid",
    orderStatus: "Pending",
    type: "product_purchase",
    createdAt: new Date().toISOString()
  });

  writeStore(store);
  res.status(201).json({ message: "Purchase successful using VG Coins", user: publicUser(user) });
});

app.get("/api/orders", authRequired, (req, res) => {
  const store = readStore();
  const orders = req.auth.isAdmin
    ? store.orders
    : store.orders.filter((order) => order.userId === req.auth.sub);
  res.json({ orders });
});

app.patch("/api/admin/orders/:orderId", authRequired, adminRequired, (req, res) => {
  const { orderStatus, paymentStatus, notes } = req.body || {};
  const store = readStore();
  const order = store.orders.find((entry) => entry.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const previousStatus = order.orderStatus;
  if (orderStatus) order.orderStatus = String(orderStatus);
  if (paymentStatus) order.paymentStatus = String(paymentStatus);
  if (notes !== undefined) order.notes = String(notes);

  if (
    order.type === "coin_topup" &&
    previousStatus !== "Delivered" &&
    order.orderStatus === "Delivered" &&
    !order.credited
  ) {
    const user = store.users.find((entry) => entry.id === order.userId);
    if (user) {
      user.coins += Number(order.totalCoins) || 0;
      order.credited = true;
      order.paymentStatus = "Approved";
      order.notes = order.notes ? `${order.notes} Coins credited by admin.` : "Coins credited by admin.";
    }
  }

  writeStore(store);
  res.json({ order });
});

app.get("/api/admin/payment-settings", authRequired, adminRequired, (_req, res) => {
  const store = readStore();
  res.json({ paymentSettings: store.paymentSettings });
});

app.put("/api/admin/payment-settings", authRequired, adminRequired, (req, res) => {
  const { methods, paypalEmail, upiId, instructions } = req.body || {};
  const store = readStore();
  store.paymentSettings = {
    methods: {
      paypal: Boolean(methods?.paypal),
      card: Boolean(methods?.card),
      upi: Boolean(methods?.upi)
    },
    paypalEmail: String(paypalEmail || "").trim(),
    upiId: String(upiId || "").trim(),
    instructions: String(instructions || "").trim()
  };
  writeStore(store);
  res.json({ paymentSettings: store.paymentSettings });
});

app.put("/api/admin/coin-packages", authRequired, adminRequired, (req, res) => {
  const { coinPackages } = req.body || {};
  if (!Array.isArray(coinPackages)) return res.status(400).json({ error: "coinPackages must be an array" });
  const store = readStore();
  store.coinPackages = coinPackages;
  writeStore(store);
  res.json({ coinPackages: store.coinPackages });
});

app.get("/api/admin/users", authRequired, adminRequired, (_req, res) => {
  const store = readStore();
  res.json({ users: store.users.map(publicUser) });
});

app.patch("/api/admin/users/:userId/coins", authRequired, adminRequired, (req, res) => {
  const { coins } = req.body || {};
  const store = readStore();
  const user = store.users.find((entry) => entry.id === req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  user.coins = Math.max(0, Number(coins) || 0);
  writeStore(store);
  res.json({ user: publicUser(user) });
});

app.patch("/api/admin/users/:userId/ban", authRequired, adminRequired, (req, res) => {
  const { banned } = req.body || {};
  const store = readStore();
  const user = store.users.find((entry) => entry.id === req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  user.banned = Boolean(banned);
  writeStore(store);
  res.json({ user: publicUser(user) });
});

app.listen(port, () => {
  console.log(`VG Realm backend listening on http://localhost:${port}`);
});
