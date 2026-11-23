const form = document.querySelector('[data-auth-form]');
const endpointFor = mode => location.pathname.startsWith('/production/')
  ? (mode === 'signup' ? '/api/auth-signup' : '/api/auth-login')
  : (mode === 'signup' ? '/api/auth/signup' : '/api/auth/login');
const logoutEndpointFor = () => '/api/auth/logout';
const savedSession = (() => { try { return JSON.parse(localStorage.getItem('virsapur-session') || 'null'); } catch { return null; } })();
if (savedSession?.expiresAt > Date.now()) document.querySelectorAll('[data-auth-logout]').forEach(button => { button.hidden = false; });
else if (savedSession) localStorage.removeItem('virsapur-session');

document.querySelectorAll('[data-auth-logout]').forEach(button => {
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await fetch(location.pathname.startsWith('/production/') ? '/api/auth-logout' : logoutEndpointFor(), { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    } finally {
      localStorage.removeItem('virsapur-session');
      location.assign('/login/');
    }
  });
});

const sessionPanel = document.querySelector('[data-session-panel]');
if (sessionPanel) {
  try {
    const session = JSON.parse(localStorage.getItem('virsapur-session') || 'null');
    if (session?.expiresAt > Date.now() && session.user) {
      sessionPanel.hidden = false;
      sessionPanel.querySelector('[data-session-name]').textContent = `Signed in as ${session.user.name || session.user.email}`;
      sessionPanel.previousElementSibling?.setAttribute('hidden', '');
      form?.setAttribute('hidden', '');
    } else localStorage.removeItem('virsapur-session');
  } catch { localStorage.removeItem('virsapur-session'); }
}

document.querySelectorAll('[data-password-toggle]').forEach(button => {
  button.addEventListener('click', () => {
    const input = button.parentElement.querySelector('input');
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    button.textContent = visible ? 'Show' : 'Hide';
    button.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
  });
});

if (form) {
  const message = form.querySelector('[data-auth-message]');
  const submit = form.querySelector('[type="submit"]');
  const initialLabel = submit.innerHTML;
  const showMessage = (text, success = false) => {
    message.textContent = text;
    message.className = `auth-message is-visible${success ? ' is-success' : ''}`;
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    message.className = 'auth-message';
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    if (data.fullName) {
      const parts = data.fullName.trim().split(/\s+/);
      data.firstName = parts.shift() || '';
      data.lastName = parts.join(' ') || data.firstName;
      delete data.fullName;
    }
    if (data.confirmPassword && data.password !== data.confirmPassword) {
      showMessage('The passwords do not match. Please check them and try again.');
      form.querySelector('[name="confirmPassword"]').focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = form.dataset.authMode === 'signup' ? 'Creating account…' : 'Signing in…';
    try {
      const endpoint = endpointFor(form.dataset.authMode);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'We could not complete that request. Please try again.');
      if (form.dataset.authMode === 'login' && result.token) {
        const remember = form.querySelector('[name="remember"]')?.checked;
        localStorage.setItem('virsapur-session', JSON.stringify({ token: result.token, user: result.user, expiresAt: Date.now() + (remember ? 30 : 1) * 86400000 }));
      }
      showMessage(form.dataset.authMode === 'signup' ? 'Your account has been created. Sign in to continue.' : 'You are signed in. Redirecting…', true);
      if (form.dataset.authMode === 'login') setTimeout(() => location.assign('/'), 700);
    } catch (error) {
      showMessage(error.message);
    } finally {
      submit.disabled = false;
      submit.innerHTML = initialLabel;
    }
  });
}
