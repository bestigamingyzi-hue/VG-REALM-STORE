const API_BASE = window.VG_API_BASE || "http://localhost:4000/api";
const adminTokenKey = "vgRealmAdminToken";

const state = {
  products: [],
  coinPackages: [],
  paymentSettings: null,
  users: [],
  orders: []
};

function token() {
  return window.localStorage.getItem(adminTokenKey) || "";
}

function setToken(value) {
  window.localStorage.setItem(adminTokenKey, value);
}

function clearToken() {
  window.localStorage.removeItem(adminTokenKey);
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function createParticles() {
  document.querySelectorAll("#admin-particles, #auth-particles").forEach((host) => {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 30; index += 1) {
      const particle = document.createElement("span");
      particle.className = "particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${65 + Math.random() * 35}%`;
      particle.style.animationDuration = `${8 + Math.random() * 10}s`;
      particle.style.animationDelay = `${Math.random() * -10}s`;
      particle.style.setProperty("--drift", `${-40 + Math.random() * 80}px`);
      fragment.appendChild(particle);
    }
    host.appendChild(fragment);
  });
}

function formatVG(value) {
  return `VG ${Number(value)}`;
}

function showAdminShell() {
  document.getElementById("auth-shell").classList.add("hidden-shell");
  document.getElementById("admin-shell").classList.remove("hidden-shell");
}

function showAuthShell(message = "Authorized admins only.") {
  document.getElementById("admin-shell").classList.add("hidden-shell");
  document.getElementById("auth-shell").classList.remove("hidden-shell");
  const el = document.getElementById("auth-message");
  el.textContent = message;
  el.className = "auth-message";
}

function renderStats() {
  const delivered = state.orders.filter((order) => order.orderStatus === "Delivered");
  const stats = [
    ["Total Orders", state.orders.length, "Tracked backend orders"],
    ["Pending Deliveries", state.orders.filter((order) => order.orderStatus === "Pending").length, "Awaiting fulfillment"],
    ["Total Users", state.users.length, "Registered accounts"],
    ["Coin Volume", formatVG(delivered.reduce((sum, order) => sum + (order.totalCoins || 0), 0)), "Delivered VG spend"]
  ];
  document.getElementById("stats-grid").innerHTML = stats.map(([label, value, note]) => `
    <article class="card stat-card"><p class="mini-label">${label}</p><strong>${value}</strong><span>${note}</span></article>
  `).join("");
}

function renderProducts() {
  document.getElementById("products-body").innerHTML = state.products.map((product) => `
    <tr>
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${formatVG(product.priceCoins)}</td>
      <td class="${product.active ? "status-active" : "status-inactive"}">${product.active ? "Active" : "Inactive"}</td>
      <td>${product.featured ? "Yes" : "No"}</td>
      <td><div class="table-actions"><button class="small-btn" data-product-edit="${product.id}">Edit</button><button class="small-btn ghost-btn" data-product-toggle="${product.id}">Toggle</button></div></td>
    </tr>
  `).join("");
}

function renderOrders() {
  document.getElementById("orders-body").innerHTML = state.orders.map((order) => `
    <tr>
      <td>${order.id}</td>
      <td>${order.user}</td>
      <td>${order.products.join(", ")}</td>
      <td>${order.totalCoins || 0}</td>
      <td>${order.paymentMethod}</td>
      <td>${order.paymentStatus}</td>
      <td class="status-${String(order.orderStatus).toLowerCase()}">${order.orderStatus}</td>
      <td>${new Date(order.createdAt).toLocaleDateString()}</td>
      <td>${order.notes || ""}${order.proofImage ? `<br><a href="${order.proofImage}" target="_blank" rel="noopener noreferrer">View Proof</a><br><span class="mini-label">${order.proofName || "payment-proof"}</span>` : ""}</td>
      <td><div class="table-actions"><button class="small-btn" data-order-status="${order.id}:Delivered">Delivered</button><button class="small-btn ghost-btn" data-order-status="${order.id}:Pending">Pending</button></div></td>
    </tr>
  `).join("");
}

function renderCoins() {
  document.getElementById("coins-body").innerHTML = state.coinPackages.map((pack) => `
    <tr>
      <td>${pack.name}</td>
      <td>${pack.amount}</td>
      <td>Value ${Number(pack.gatewayPrice).toFixed(2)}</td>
      <td class="${pack.enabled ? "status-enabled" : "status-inactive"}">${pack.enabled ? "Enabled" : "Disabled"}</td>
      <td>${pack.highlighted ? "Yes" : "No"}</td>
      <td><div class="table-actions"><button class="small-btn" data-coin-edit="${pack.id}">Edit</button><button class="small-btn ghost-btn" data-coin-toggle="${pack.id}">Toggle</button></div></td>
    </tr>
  `).join("");
}

function renderUsers() {
  document.getElementById("users-body").innerHTML = state.users.map((user) => `
    <tr>
      <td>${user.minecraftUsername}</td>
      <td>${user.email}</td>
      <td>${user.coins}</td>
      <td class="${user.banned ? "status-banned" : "status-online"}">${user.banned ? "Banned" : "Active"}</td>
      <td><span class="history-chip">Live backend user</span></td>
      <td><div class="table-actions"><button class="small-btn" data-user-coins="${user.id}">Edit Coins</button><button class="small-btn ghost-btn" data-user-ban="${user.id}:${user.banned ? "false" : "true"}">${user.banned ? "Unban" : "Ban"}</button></div></td>
    </tr>
  `).join("");
}

function renderSettings() {
  const settings = state.paymentSettings;
  if (!settings) return;
  document.getElementById("pay-vgcoins").checked = true;
  document.getElementById("pay-paypal").checked = settings.methods.paypal;
  document.getElementById("pay-card").checked = settings.methods.card;
  document.getElementById("pay-upi").checked = settings.methods.upi;
  document.getElementById("payment-upi-id").value = settings.upiId || "";
  document.getElementById("payment-paypal-email").value = settings.paypalEmail || "";
  document.getElementById("payment-instructions-text").value = settings.instructions || "";
}

function renderAll() {
  renderStats();
  renderProducts();
  renderOrders();
  renderCoins();
  renderUsers();
  renderSettings();
}

async function loadAdminData() {
  const [productsRes, packsRes, usersRes, ordersRes, settingsRes] = await Promise.all([
    api("/admin/products"),
    api("/coin-packages"),
    api("/admin/users"),
    api("/orders"),
    api("/admin/payment-settings")
  ]);
  state.products = productsRes.products;
  state.coinPackages = packsRes.coinPackages;
  state.users = usersRes.users;
  state.orders = ordersRes.orders;
  state.paymentSettings = settingsRes.paymentSettings;
  renderAll();
}

function bindSectionNav() {
  const title = document.getElementById("section-title");
  document.querySelectorAll(".sidebar-link").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-link").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".panel-section").forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      document.querySelector(`[data-panel="${button.dataset.section}"]`).classList.add("active");
      title.textContent = button.textContent;
    });
  });
}

function bindAuth() {
  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("login-email").value,
          password: document.getElementById("login-password").value
        })
      });
      setToken(data.token);
      showAdminShell();
      await loadAdminData();
    } catch (error) {
      const el = document.getElementById("auth-message");
      el.textContent = error.message;
      el.className = "auth-message error";
    }
  });
}

function bindForms() {
  document.getElementById("payment-settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await api("/admin/payment-settings", {
      method: "PUT",
      body: JSON.stringify({
        methods: {
          paypal: document.getElementById("pay-paypal").checked,
          card: document.getElementById("pay-card").checked,
          upi: document.getElementById("pay-upi").checked
        },
        paypalEmail: document.getElementById("payment-paypal-email").value,
        upiId: document.getElementById("payment-upi-id").value,
        instructions: document.getElementById("payment-instructions-text").value
      })
    });
    await loadAdminData();
  });
}

function bindActions() {
  document.body.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.id === "logout-btn") {
      clearToken();
      showAuthShell("Logged out.");
      return;
    }

    if (button.dataset.userCoins) {
      const next = window.prompt("Set new VG Coins");
      if (next !== null) {
        await api(`/admin/users/${button.dataset.userCoins}/coins`, { method: "PATCH", body: JSON.stringify({ coins: Number(next) || 0 }) });
        await loadAdminData();
      }
    }

    if (button.dataset.userBan) {
      const [id, banned] = button.dataset.userBan.split(":");
      await api(`/admin/users/${id}/ban`, { method: "PATCH", body: JSON.stringify({ banned: banned === "true" }) });
      await loadAdminData();
    }

    if (button.dataset.orderStatus) {
      const [id, orderStatus] = button.dataset.orderStatus.split(":");
      await api(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ orderStatus }) });
      await loadAdminData();
    }
  });
}

(async function init() {
  createParticles();
  bindAuth();
  bindSectionNav();
  bindForms();
  bindActions();
  if (!token()) return showAuthShell();
  try {
    await api("/me");
    showAdminShell();
    await loadAdminData();
  } catch {
    clearToken();
    showAuthShell("Admin login required.");
  }
})();
