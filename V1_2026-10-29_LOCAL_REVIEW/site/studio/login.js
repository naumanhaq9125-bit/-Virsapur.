(() => {
  const form = document.querySelector("[data-login]");
  const message = document.querySelector("[data-login-message]");
  if (new URLSearchParams(location.search).has("expired")) message.textContent = "Your session expired. Please sign in again.";
  form.addEventListener("submit", async event => {
    event.preventDefault();
    message.textContent = "Signing in…";
    const response = await fetch("/api/auth-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.elements.email.value, password: form.elements.password.value }) });
    const result = await response.json();
    if (!response.ok) { message.textContent = result.error || "Sign in failed."; return; }
    location.replace("/admin/");
  });
})();
