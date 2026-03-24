// ------------------- GUEST CHECK START -------------------
const user = JSON.parse(localStorage.getItem("user"));

// Hide or reset user stats for guests
if (!user) {
  // Hide top nav coins/profile/logout
  document.getElementById("navUserInfo").style.display = "none";

  // Reset bottom stats or hide summary
  document.getElementById("ranksOwned").innerText = "0";
  document.getElementById("purchases").innerText = "0";
  document.getElementById("summary").style.display = "none"; // optional
} else {
  // Show top nav for logged-in users
  document.getElementById("navUserInfo").style.display = "flex";

  // Populate bottom summary stats
  document.getElementById("ranksOwned").innerText = user.ranks?.length || 0;
  document.getElementById("purchases").innerText = user.purchases?.length || 0;
  document.getElementById("summary").style.display = "block";
}
// ------------------- GUEST CHECK END -------------------
document.querySelectorAll("[data-purchase]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!user) {
      showAuthModal(); // open login/register modal
      return;
    }
    // logged-in user logic here
  });
});

document.querySelectorAll("[data-add-cart]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!user) {
      showAuthModal(); // open login/register modal
      return;
    }
    // logged-in user logic here
  });
});

const API_BASE = window.VG_API_BASE || "http://localhost:4000/api";
const authTokenKey = "vgRealmAuthToken";
const userKey = "vgRealmAuthUser";

const productNameToId = {
  "Overlord Rank": "prod_1",
  "Inferno Crate": "prod_2",
  "Nova Key Bundle": "prod_3",
  "Blaze Aura Trail": "prod_4",
  "Mythic Rank": "prod_5",
  "Dragonfire Wings": "prod_6"
};

const particleHosts = document.querySelectorAll("#particles");
particleHosts.forEach((host) => {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 28; index += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${60 + Math.random() * 40}%`;
    particle.style.animationDuration = `${8 + Math.random() * 10}s`;
    particle.style.animationDelay = `${Math.random() * -12}s`;
    particle.style.setProperty("--drift", `${-40 + Math.random() * 80}px`);
    fragment.appendChild(particle);
  }
  host.appendChild(fragment);
});

const state = {
  user: readJson(userKey, null),
  cart: [],
  orders: [],
  coinPackages: [],
  paymentSettings: null
};

function readJson(key, fallback) {
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getToken() {
  return window.localStorage.getItem(authTokenKey) || "";
}

function setSession(token, user) {
  window.localStorage.setItem(authTokenKey, token);
  writeJson(userKey, user);
  state.user = user;
}

function clearSession() {
  window.localStorage.removeItem(authTokenKey);
  window.localStorage.removeItem(userKey);
  state.user = null;
  state.cart = [];
  state.orders = [];
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function formatVG(value) {
  return `<span class="vg-inline"><span class="vg-mark">VG</span><span>${Number(value)}</span></span>`;
}

function toast(message, type = "") {
  let el = document.getElementById("site-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "site-toast";
    el.className = "site-toast hidden";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = `site-toast${type ? ` ${type}` : ""}`;
  el.classList.remove("hidden");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.add("hidden"), 1800);
}

function authModal() {
  let overlay = document.getElementById("auth-overlay");
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.id = "auth-overlay";
  overlay.className = "auth-overlay hidden";
  overlay.innerHTML = `
    <div class="auth-modal">
      <section class="auth-modal-copy">
        <button class="auth-close outline" type="button" id="auth-close">X</button>
        <p class="eyebrow">Secure Realm Access</p>
        <h2>Unlock Your VG Realm Account</h2>
        <p>Sign in to store your VG Coins, add products to cart, and finish wallet-based checkout.</p>
      </section>
      <section class="auth-panel">
        <div class="auth-tabs">
          <button class="auth-tab active" type="button" data-auth-tab="login">Login</button>
          <button class="auth-tab" type="button" data-auth-tab="register">Register</button>
        </div>
        <div class="auth-form-panel active" data-auth-panel="login">
          <form class="auth-form" id="login-form">
            <label><span>Email</span><input type="email" id="login-email" required></label>
            <label><span>Password</span><input type="password" id="login-password" required></label>
            <div class="auth-actions"><button type="submit">Login</button></div>
          </form>
        </div>
        <div class="auth-form-panel" data-auth-panel="register">
          <form class="auth-form" id="register-form">
            <label><span>Minecraft Username</span><input type="text" id="register-name" required></label>
            <label><span>Email</span><input type="email" id="register-email" required></label>
            <label><span>Password</span><input type="password" id="register-password" required></label>
            <div class="auth-actions"><button type="submit">Create Account</button></div>
          </form>
        </div>
        <p class="auth-feedback" id="auth-feedback">Sign in to continue.</p>
      </section>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeAuthModal(); });
  overlay.querySelector("#auth-close").addEventListener("click", closeAuthModal);
  overlay.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      overlay.querySelectorAll("[data-auth-tab]").forEach((item) => item.classList.remove("active"));
      overlay.querySelectorAll("[data-auth-panel]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      overlay.querySelector(`[data-auth-panel="${button.dataset.authTab}"]`).classList.add("active");
    });
  });
  overlay.querySelector("#login-form").addEventListener("submit", handleLogin);
  overlay.querySelector("#register-form").addEventListener("submit", handleRegister);
  return overlay;
}

function openAuthModal(message = "Sign in to continue.", mode = "login") {
  const overlay = authModal();
  overlay.classList.remove("hidden");
  overlay.querySelector("#auth-feedback").textContent = message;
  overlay.querySelectorAll("[data-auth-tab]").forEach((item) => item.classList.toggle("active", item.dataset.authTab === mode));
  overlay.querySelectorAll("[data-auth-panel]").forEach((item) => item.classList.toggle("active", item.dataset.authPanel === mode));
}

function closeAuthModal() {
  const overlay = document.getElementById("auth-overlay");
  if (overlay) overlay.classList.add("hidden");
}

async function handleLogin(event) {
  event.preventDefault();
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value
      })
    });
    setSession(data.token, data.user);
    closeAuthModal();
    await hydrateAuthedState();
    renderAll();
    toast("Welcome back", "success");
  } catch (error) {
    document.getElementById("auth-feedback").textContent = error.message;
    document.getElementById("auth-feedback").className = "auth-feedback error";
  }
}

async function handleRegister(event) {
  event.preventDefault();
  try {
    const data = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        minecraftUsername: document.getElementById("register-name").value,
        email: document.getElementById("register-email").value,
        password: document.getElementById("register-password").value
      })
    });
    setSession(data.token, data.user);
    closeAuthModal();
    state.cart = [];
    renderAll();
    toast("Account created", "success");
  } catch (error) {
    document.getElementById("auth-feedback").textContent = error.message;
    document.getElementById("auth-feedback").className = "auth-feedback error";
  }
}

async function hydrateAuthedState() {
  if (!getToken()) return;
  try {
    const [{ user }, { cart }, { orders }] = await Promise.all([
      api("/me"),
      api("/cart"),
      api("/orders")
    ]);
    state.user = user;
    state.cart = cart;
    state.orders = orders;
    writeJson(userKey, user);
  } catch {
    clearSession();
  }
}

async function loadPublicData() {
  try {
    const { coinPackages, paymentSettings } = await api("/coin-packages");
    state.coinPackages = coinPackages;
    state.paymentSettings = paymentSettings;
  } catch {
    state.coinPackages = [];
  }
}

function renderNavbar() {
  const navMeta = document.querySelector(".nav-meta");
  if (!navMeta) return;
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  navMeta.innerHTML = state.user
    ? `<div class="coin-pill">${formatVG(state.user.coins)}</div><button class="nav-action" type="button" id="cart-link-btn">Cart (${count})</button><div class="nav-user-chip">${state.user.minecraftUsername}</div><button class="nav-action outline" type="button" id="logout-btn">Logout</button>`
    : `<div class="coin-pill">${formatVG(500)}</div><button class="nav-action" type="button" id="cart-link-btn">Cart (${count})</button><button class="nav-action" type="button" id="login-btn">Login</button><button class="nav-action outline" type="button" id="register-btn">Register</button>`;
}

async function addProductToCart(productName) {
  if (!state.user) return openAuthModal(`Login or register to add ${productName} to cart.`);
  try {
    await api("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId: productNameToId[productName], quantity: 1 })
    });
    await hydrateAuthedState();
    renderAll();
    toast(`${productName} added to cart`, "success");
  } catch (error) {
    toast(error.message, "error");
  }
}

async function buySingleProduct(productName) {
  if (!state.user) return openAuthModal(`Login or register to purchase ${productName}.`);
  try {
    await api("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId: productNameToId[productName], quantity: 1 })
    });
    await api("/checkout/coins", { method: "POST" });
    await hydrateAuthedState();
    renderAll();
    toast("Purchase successful using VG Coins", "success");
  } catch (error) {
    if (error.message.includes("Insufficient")) {
      toast("Insufficient VG Coins", "error");
      setTimeout(() => { window.location.href = "buy-coins.html"; }, 700);
      return;
    }
    toast(error.message, "error");
  }
}

async function updateCartQuantity(productId, quantity) {
  try {
    await api(`/cart/items/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity })
    });
    await hydrateAuthedState();
    renderAll();
  } catch (error) {
    toast(error.message, "error");
  }
}

async function removeCartItem(productId) {
  try {
    await api(`/cart/items/${productId}`, { method: "DELETE" });
    await hydrateAuthedState();
    renderAll();
    toast("Item removed", "success");
  } catch (error) {
    toast(error.message, "error");
  }
}

function renderCartPage() {
  const host = document.getElementById("cart-items");
  if (!host) return;
  const total = state.cart.reduce((sum, item) => sum + item.product.priceCoins * item.quantity, 0);
  host.innerHTML = state.cart.length
    ? state.cart.map((item) => `
      <article class="card cart-item">
        <div class="cart-item-visual"></div>
        <div class="cart-item-copy">
          <h3>${item.product.name}</h3>
          <p>${item.product.category}</p>
          <strong>${formatVG(item.product.priceCoins)}</strong>
        </div>
        <div class="cart-quantity">
          <button class="outline small-cart-btn" type="button" data-qty="${item.productId}:${Math.max(1, item.quantity - 1)}">-</button>
          <span>${item.quantity}</span>
          <button class="outline small-cart-btn" type="button" data-qty="${item.productId}:${item.quantity + 1}">+</button>
        </div>
        <button class="danger-inline" type="button" data-remove="${item.productId}">Remove</button>
      </article>
    `).join("")
    : `<article class="card empty-state"><h3>Your cart is empty</h3><p>Add products from the store to continue.</p><button data-nav="store.html">Open Store</button></article>`;
  const totalEl = document.getElementById("cart-total");
  const countEl = document.getElementById("cart-count");
  if (totalEl) totalEl.innerHTML = formatVG(total);
  if (countEl) countEl.textContent = `${state.cart.reduce((s, i) => s + i.quantity, 0)} items in cart`;
}

function renderCheckoutPage() {
  const summary = document.getElementById("checkout-summary");
  if (!summary) return;
  const total = state.cart.reduce((sum, item) => sum + item.product.priceCoins * item.quantity, 0);
  summary.innerHTML = state.cart.map((item) => `<div class="checkout-item"><span>${item.product.name} x${item.quantity}</span><strong>${formatVG(item.product.priceCoins * item.quantity)}</strong></div>`).join("") || "<p>Your cart is empty.</p>";
  const totalEl = document.getElementById("checkout-total");
  if (totalEl) totalEl.innerHTML = formatVG(total);
  const note = document.getElementById("payment-instructions");
  if (note) note.innerHTML = `<div class="checkout-note"><p>Your current balance: ${formatVG(state.user?.coins || 0)}</p></div>`;
}

function renderPurchasesPage() {
  const tbody = document.querySelector(".data-table tbody");
  if (!tbody || document.body.dataset.page !== "purchases") return;
  if (!state.orders.length) return;
  tbody.innerHTML = state.orders.map((order) => `
    <tr>
      <td>${order.products.join(", ")}</td>
      <td>${order.totalCoins}</td>
      <td><span class="status ${String(order.paymentStatus).includes("Proof") || String(order.paymentStatus).includes("Pending") ? "pending" : "complete"}">${order.paymentStatus}</span></td>
      <td><span class="status ${order.orderStatus === "Pending" ? "pending" : "complete"}">${order.orderStatus}</span></td>
      <td>${new Date(order.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join("");
}

function renderCoinPackagesPage() {
  if (document.body.dataset.page !== "coins") return;
  const cards = document.querySelectorAll(".coin-card");
  state.coinPackages.forEach((pack, index) => {
    const card = cards[index];
    if (!card) return;
    card.querySelector(".coin-amount").innerHTML = formatVG(pack.amount);
    card.querySelector("h3").textContent = pack.name;
    const btn = card.querySelector("[data-coin-pack]");
    btn.dataset.coinPack = pack.id;
  });
}

function paymentModal() {
  let overlay = document.getElementById("payment-overlay");
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.id = "payment-overlay";
  overlay.className = "auth-overlay hidden";
  overlay.innerHTML = `
    <div class="auth-modal payment-modal">
      <section class="auth-modal-copy">
        <button class="auth-close outline" type="button" id="payment-close">X</button>
        <p class="eyebrow">Coin Top-Up</p>
        <h2 id="payment-pack-title">Buy VG Coins</h2>
        <p id="payment-pack-copy">Choose a payment method to top up your VG balance.</p>
      </section>
      <section class="auth-panel">
        <div class="payment-options" id="coin-payment-options"></div>
        <div class="checkout-note" id="coin-payment-instructions"></div>
        <div class="auth-form">
          <label>
            <span>Payment Screenshot</span>
            <input type="file" id="payment-proof-file" accept="image/*">
          </label>
          <p class="auth-feedback" id="payment-proof-feedback">Attach your payment screenshot before submitting.</p>
        </div>
        <div class="checkout-footer">
          <div class="price-tag" id="payment-pack-amount"></div>
          <button id="confirm-coin-payment">Confirm Payment</button>
        </div>
      </section>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.add("hidden"); });
  overlay.querySelector("#payment-close").addEventListener("click", () => overlay.classList.add("hidden"));
  return overlay;
}

function openCoinPayment(packageId) {
  if (!state.user) return openAuthModal("Login or register to buy VG Coins.");
  const pack = state.coinPackages.find((item) => item.id === packageId);
  if (!pack) return;
  const modal = paymentModal();
  modal.classList.remove("hidden");
  modal.dataset.packageId = packageId;
  document.getElementById("payment-pack-title").innerHTML = `Buy ${formatVG(pack.amount)}`;
  document.getElementById("payment-pack-amount").innerHTML = formatVG(pack.amount);
  const methods = [
    ["paypal", state.paymentSettings?.paypalEmail || "PayPal"],
    ["card", "Card payment"],
    ["upi", state.paymentSettings?.upiId || "UPI"]
  ].filter(([key]) => state.paymentSettings?.methods?.[key]);
  document.getElementById("coin-payment-options").innerHTML = methods.map(([key, note], index) => `
    <button type="button" class="payment-option${index === 0 ? " active" : ""}" data-topup-method="${key}">
      <strong>${key.toUpperCase()}</strong><span>${note}</span>
    </button>`).join("");
  document.getElementById("coin-payment-instructions").innerHTML = `<p>${state.paymentSettings?.instructions || ""}</p>`;
}

async function confirmCoinPayment() {
  const modal = document.getElementById("payment-overlay");
  const active = document.querySelector("[data-topup-method].active");
  if (!modal || !active) return;
  const fileInput = document.getElementById("payment-proof-file");
  const file = fileInput?.files?.[0];
  const feedback = document.getElementById("payment-proof-feedback");
  if (!file) {
    if (feedback) {
      feedback.textContent = "Attach a payment screenshot first.";
      feedback.className = "auth-feedback error";
    }
    return;
  }
  try {
    const proofImage = await readFileAsDataUrl(file);
    const data = await api("/coins/top-up", {
      method: "POST",
      body: JSON.stringify({
        packageId: modal.dataset.packageId,
        paymentMethod: active.dataset.topupMethod,
        proofName: file.name,
        proofImage
      })
    });
    state.user = data.user;
    writeJson(userKey, state.user);
    modal.classList.add("hidden");
    renderAll();
    toast("Payment proof submitted. Admin review pending.", "success");
  } catch (error) {
    if (feedback) {
      feedback.textContent = error.message;
      feedback.className = "auth-feedback error";
    }
    toast(error.message, "error");
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function checkoutCart() {
  if (!state.user) return openAuthModal("Login or register to place your order.");
  try {
    await api("/checkout/coins", { method: "POST" });
    await hydrateAuthedState();
    renderAll();
    toast("Purchase successful using VG Coins", "success");
    window.location.href = "purchases.html";
  } catch (error) {
    if (error.message.includes("Insufficient")) {
      toast("Insufficient VG Coins", "error");
      setTimeout(() => { window.location.href = "buy-coins.html"; }, 700);
      return;
    }
    toast(error.message, "error");
  }
}

function renderAll() {
  renderNavbar();
  renderCartPage();
  renderCheckoutPage();
  renderPurchasesPage();
  renderCoinPackagesPage();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.id === "login-btn") return openAuthModal();
  if (button.id === "register-btn") return openAuthModal("Create your account.", "register");
  if (button.id === "logout-btn") { clearSession(); renderAll(); return; }
  if (button.id === "cart-link-btn") return (window.location.href = "cart.html");
  if (button.dataset.addCart) return addProductToCart(button.dataset.addCart);
  if (button.dataset.purchase) return buySingleProduct(button.dataset.purchase);
  if (button.dataset.coinPack) return openCoinPayment(button.dataset.coinPack);
  if (button.dataset.topupMethod) {
    document.querySelectorAll("[data-topup-method]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    return;
  }
  if (button.id === "confirm-coin-payment") return confirmCoinPayment();
  if (button.id === "checkout-btn" || button.id === "place-order-btn") return checkoutCart();
  if (button.dataset.qty) {
    const [productId, quantity] = button.dataset.qty.split(":");
    return updateCartQuantity(productId, Number(quantity));
  }
  if (button.dataset.remove) return removeCartItem(button.dataset.remove);
  if (button.hasAttribute("data-nav")) window.location.href = button.getAttribute("data-nav");
});

document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelectorAll(".product-card").forEach((card) => {
      card.classList.toggle("hidden", !(filter === "all" || filter === card.dataset.category));
    });
  });
});

(async function init() {
  await loadPublicData();
  await hydrateAuthedState();
  renderAll();
})();
