import { API_BASE } from "./api-config.js";

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const minecraftUsername = document.getElementById("minecraftUsername").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minecraftUsername, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Registered successfully! Please login.");
      window.location.href = "login.html";
    } else {
      alert(data.error || "Registration failed");
    }
  } catch (err) {
    alert("Server error: " + err.message);
  }
});
