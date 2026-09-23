/* ============================================
   EDU-LINK AI — SIGNUP PAGE JS
   ============================================ */

let selectedRole = 'student';

document.addEventListener('DOMContentLoaded', () => {
  Guard.redirectIfLoggedIn();
  initPasswordToggle();
  initRoleSelector();
  initSignupForm();
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

/* ---------- ROLE SELECTOR ---------- */
function initRoleSelector() {
  const buttons = document.querySelectorAll('.role-option');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedRole = btn.dataset.role;
      updateRoleField(selectedRole);
    });
  });

  updateRoleField('student');
}

function updateRoleField(role) {
  const field = document.getElementById('roleSpecificField');
  if (!field) return;

  const label = field.querySelector('.form-label');
  const input = field.querySelector('input');
  const icon = field.querySelector('i');

  const config = {
    student: {
      label: 'College Name',
      placeholder: 'Enter your college name',
      icon: 'fa-solid fa-building-columns',
      inputId: 'collegeName',
      inputName: 'collegeName'
    },
    college: {
      label: 'College / Institute Name',
      placeholder: 'Enter your institution name',
      icon: 'fa-solid fa-building-columns',
      inputId: 'collegeName',
      inputName: 'collegeName'
    },
    company: {
      label: 'Company Name',
      placeholder: 'Enter your company name',
      icon: 'fa-solid fa-briefcase',
      inputId: 'companyName',
      inputName: 'companyName'
    }
  };

  const cfg = config[role];
  label.textContent = cfg.label;
  input.placeholder = cfg.placeholder;
  input.id = cfg.inputId;
  input.name = cfg.inputName;
  icon.className = cfg.icon;
}

/* ---------- SIGNUP FORM ---------- */
function initSignupForm() {
  const form = document.getElementById('signupForm');
  const signupBtn = document.getElementById('signupBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;

    const roleInput = document.getElementById('roleSpecificField').querySelector('input');
    const roleSpecificValue = roleInput ? roleInput.value.trim() : '';

    // Validations
    if (!name || !email || !password || !confirmPassword) {
      showAlert('Please fill in all fields', 'danger');
      return;
    }

    if (!isValidEmail(email)) {
      showAlert('Please enter a valid email address', 'danger');
      return;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters', 'danger');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match', 'danger');
      return;
    }

    if (!terms) {
      showAlert('Please accept the Terms & Privacy Policy', 'danger');
      return;
    }

    // Build payload
    const payload = {
      name,
      email,
      password,
      role: selectedRole
    };

    if (selectedRole === 'student' || selectedRole === 'college') {
      payload.college_name = roleSpecificValue;
    } else if (selectedRole === 'company') {
      payload.company_name = roleSpecificValue;
    }

    setLoading(signupBtn, true);
    hideAlert();

    try {
      const result = await Auth.signup(payload);
      showAlert('Account created successfully! Redirecting...', 'success');

      setTimeout(() => {
        Auth.redirectToDashboard(result.user.role);
      }, 700);

    } catch (error) {
      showAlert(error.message || 'Signup failed. Please try again.', 'danger');
      setLoading(signupBtn, false);
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