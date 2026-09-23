/* ============================================
   EDU-LINK AI — STUDENT PROFILE JS
   ============================================ */

let skills = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!Guard.requireAuth('student')) return;

  Layout.renderDashboard({
    role: 'student',
    activePage: 'profile',
    pageTitle: 'My Profile'
  });

  initTabs();
  initPersonalForm();
  initSkillForm();
  initResumeUpload();

  loadProfile();
  loadSkills();
});

/* ---------- TABS ---------- */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      document.querySelectorAll('.tab-btn').forEach((b) =>
        b.classList.toggle('active', b.dataset.tab === target)
      );

      document.querySelectorAll('.tab-panel').forEach((p) =>
        p.classList.toggle('active', p.id === `tab-${target}`)
      );
    });
  });
}

/* ---------- LOAD PROFILE ---------- */
async function loadProfile() {
  try {
    const data = await API.get('/student/profile');
    const user = data.user;

    document.getElementById('fullName').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('college').value = user.college_name || '';
    document.getElementById('branch').value = user.branch || '';
    document.getElementById('year').value = user.year || '';
    document.getElementById('cgpa').value = user.cgpa || '';
    document.getElementById('bio').value = user.bio || '';
  } catch (error) {
    console.error('Profile load error:', error);
  }
}

/* ---------- PERSONAL FORM ---------- */
function initPersonalForm() {
  const form = document.getElementById('personalForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');

    const data = {
      name: document.getElementById('fullName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      college_name: document.getElementById('college').value.trim(),
      branch: document.getElementById('branch').value,
      year: document.getElementById('year').value,
      cgpa: document.getElementById('cgpa').value,
      bio: document.getElementById('bio').value.trim()
    };

    btn.disabled = true;

    try {
      await API.put('/student/profile', data);
      showAlert('Profile updated successfully!', 'success');
    } catch (error) {
      showAlert(error.message || 'Failed to save', 'danger');
    } finally {
      btn.disabled = false;
    }
  });
}

/* ---------- LOAD SKILLS ---------- */
async function loadSkills() {
  try {
    const data = await API.get('/student/skills');
    skills = data.skills || [];
    renderSkills();
  } catch (error) {
    console.error('Skills load error:', error);
  }
}

/* ---------- ADD SKILL ---------- */
function initSkillForm() {
  const form = document.getElementById('addSkillForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const input = document.getElementById('newSkillInput');
    const levelSelect = document.getElementById('skillLevel');
    const name = input.value.trim();
    const level = levelSelect.value;

    if (!name) return;

    try {
      const data = await API.post('/student/skills', { name, level });
      skills.push(data.skill);
      input.value = '';
      levelSelect.value = 'intermediate';
      renderSkills();
      showAlert(`Skill "${name}" added`, 'success');
    } catch (error) {
      showAlert(error.message || 'Failed to add skill', 'danger');
    }
  });
}

/* ---------- RENDER SKILLS ---------- */
function renderSkills() {
  const listEl = document.getElementById('skillsList');
  const emptyEl = document.getElementById('skillsEmpty');
  const countEl = document.getElementById('skillsCount');

  if (!listEl) return;

  countEl.textContent = `${skills.length} skill${skills.length !== 1 ? 's' : ''}`;

  if (skills.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');

  listEl.innerHTML = skills
    .map((skill) => `
      <div class="skill-item">
        <div class="skill-item-icon">
          <i class="fa-solid fa-code"></i>
        </div>
        <div class="skill-item-content">
          <div class="skill-item-name">${escapeHtml(skill.name)}</div>
          <div class="skill-item-meta">
            <span class="level-badge level-${skill.level}">${skill.level}</span>
            <span>· ${skill.source === 'resume' ? 'From Resume' : 'Manual'}</span>
          </div>
        </div>
        <button class="skill-action-btn" onclick="deleteSkill(${skill.id})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `)
    .join('');
}

async function deleteSkill(id) {
  if (!confirm('Delete this skill?')) return;

  try {
    await API.delete(`/student/skills/${id}`);
    skills = skills.filter((s) => s.id !== id);
    renderSkills();
    showAlert('Skill deleted', 'info');
  } catch (error) {
    showAlert(error.message || 'Failed to delete', 'danger');
  }
}

window.deleteSkill = deleteSkill;

/* ---------- RESUME UPLOAD ---------- */
function initResumeUpload() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('resumeInput');
  const browseBtn = document.getElementById('browseBtn');

  if (!dropzone) return;

  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleResumeUpload(e.target.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleResumeUpload(files[0]);
    }
  });
}

async function handleResumeUpload(file) {
  if (file.type !== 'application/pdf') {
    showAlert('Only PDF files are allowed', 'danger');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showAlert('File size must be under 5 MB', 'danger');
    return;
  }

  const progressEl = document.getElementById('uploadProgress');
  const statusText = document.getElementById('uploadStatusText');

  progressEl.classList.remove('hidden');
  statusText.textContent = 'Uploading and extracting skills...';

  const formData = new FormData();
  formData.append('resume', file);

  try {
    const result = await API.upload('/resume/upload', formData);

    progressEl.classList.add('hidden');

    const extractedEl = document.getElementById('extractedSkills');
    const listEl = document.getElementById('extractedSkillsList');

    if (result.skills && result.skills.length > 0) {
      extractedEl.classList.remove('hidden');
      listEl.innerHTML = result.skills
        .map((s) => `<span class="skill-chip matched"><i class="fa-solid fa-check"></i> ${s.name}</span>`)
        .join('');

      showAlert(`🎉 ${result.new_skills} new skills extracted from resume!`, 'success');

      // Reload skills
      loadSkills();
    } else {
      showAlert('Resume uploaded but no skills detected. Try a different resume.', 'warning');
    }
  } catch (error) {
    progressEl.classList.add('hidden');
    showAlert(error.message || 'Failed to upload resume', 'danger');
  }
}

/* ---------- HELPERS ---------- */
function showAlert(message, type = 'info') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;

  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove('hidden');

  setTimeout(() => alertBox.classList.add('hidden'), 5000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}