/* ============================================
   EDU-LINK AI — POST INTERNSHIP JS
   ============================================ */

let requiredSkills = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!Guard.requireAuth('company')) return;

  Layout.renderDashboard({
    role: 'company',
    activePage: 'post',
    pageTitle: 'Post Internship'
  });

  initForm();
  initSkillInput();
});

/* ---------- FORM ---------- */
function initForm() {
  const form = document.getElementById('postInternshipForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('submitBtn');

    const data = {
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      location: document.getElementById('location').value,
      type: document.getElementById('type').value,
      duration: document.getElementById('duration').value,
      stipend: document.getElementById('stipend').value,
      openings: document.getElementById('openings').value || 1,
      skills_required: requiredSkills
    };

    // Validation
    if (!data.title || data.title.length < 3) {
      showAlert('Please enter a valid title', 'danger');
      return;
    }
    if (!data.description || data.description.length < 20) {
      showAlert('Description must be at least 20 characters', 'danger');
      return;
    }
    if (!data.location || !data.type || !data.duration) {
      showAlert('Please fill all required fields', 'danger');
      return;
    }
    if (!data.stipend || parseInt(data.stipend) <= 0) {
      showAlert('Please enter valid stipend', 'danger');
      return;
    }
    if (requiredSkills.length === 0) {
      showAlert('Please add at least one required skill', 'danger');
      return;
    }

    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      await API.post('/company/internships', data);
      showAlert('🎉 Internship posted successfully!', 'success');

      setTimeout(() => {
        form.reset();
        requiredSkills = [];
        renderAddedSkills();
        btn.classList.remove('btn-loading');
        btn.disabled = false;
      }, 1500);

    } catch (error) {
      showAlert(error.message || 'Failed to post internship', 'danger');
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  });
}

/* ---------- SKILL INPUT ---------- */
function initSkillInput() {
  const input = document.getElementById('skillInput');
  if (!input) return;

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  });
}

function addSkill() {
  const input = document.getElementById('skillInput');
  const name = input.value.trim();

  if (!name) return;

  const exists = requiredSkills.find((s) => s.toLowerCase() === name.toLowerCase());
  if (exists) {
    showAlert('Skill already added', 'warning');
    input.value = '';
    return;
  }

  requiredSkills.push(name);
  input.value = '';
  input.focus();

  renderAddedSkills();
}

function quickAddSkill(name) {
  const exists = requiredSkills.find((s) => s.toLowerCase() === name.toLowerCase());
  if (exists) {
    showAlert('Skill already added', 'warning');
    return;
  }

  requiredSkills.push(name);
  renderAddedSkills();
}

function removeSkill(name) {
  requiredSkills = requiredSkills.filter((s) => s !== name);
  renderAddedSkills();
}

window.addSkill = addSkill;
window.quickAddSkill = quickAddSkill;
window.removeSkill = removeSkill;

/* ---------- RENDER SKILLS ---------- */
function renderAddedSkills() {
  const container = document.getElementById('addedSkills');
  if (!container) return;

  if (requiredSkills.length === 0) {
    container.innerHTML = `
      <div class="empty-skills" id="emptySkills">
        <i class="fa-solid fa-lightbulb"></i>
        <p>No skills added yet. Add skills to help match better candidates.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = requiredSkills
    .map((skill) => `
      <div class="added-skill">
        <span>${skill}</span>
        <button type="button" class="skill-remove-btn" onclick="removeSkill('${skill.replace(/'/g, "\\'")}')">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `)
    .join('');
}

/* ---------- HELPERS ---------- */
function showAlert(message, type = 'info') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;

  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  setTimeout(() => alertBox.classList.add('hidden'), 4000);
}