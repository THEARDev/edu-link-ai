/* ============================================
   EDU-LINK AI — LOGIN PAGE JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  Guard.redirectIfLoggedIn();

  // Init UI
  initPasswordToggle();
  initLoginForm();
});

/* ---------- PASSWORD TOGGLE ---------- */
function initPasswordToggle() {
  const toggleBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');

  if (!toggleBtn || !passwordInput) return;

  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';

    const icon = toggleBtn.querySelector('i');
    icon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  });
}

/* ---------- LOGIN FORM ---------- */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validate
    if (!email || !password) {
      showAlert('Please fill in all fields', 'danger');
      return;
    }

    if (!isValidEmail(email)) {
      showAlert('Please enter a valid email address', 'danger');
      return;
    }

    // Loading state
    setLoading(loginBtn, true);
    hideAlert();

    try {
      const result = await Auth.login(email, password);

      showAlert('Login successful! Redirecting...', 'success');

      setTimeout(() => {
        Auth.redirectToDashboard(result.user.role);
      }, 600);

    } catch (error) {
      showAlert(error.message || 'Login failed. Please try again.', 'danger');
      setLoading(loginBtn, false);
    }
  });
}

/* ---------- HELPERS ---------- */

function showAlert(message, type = 'info') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;

  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove('hidden');

  if (type !== 'success') {
    setTimeout(() => alertBox.classList.add('hidden'), 5000);
  }
}

function hideAlert() {
  const alertBox = document.getElementById('alertBox');
  if (alertBox) alertBox.classList.add('hidden');
}

function setLoading(button, isLoading) {
  if (!button) return;

  if (isLoading) {
    button.classList.add('btn-loading');
    button.disabled = true;
  } else {
    button.classList.remove('btn-loading');
    button.disabled = false;
  }
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}