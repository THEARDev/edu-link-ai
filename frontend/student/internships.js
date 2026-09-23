/* ============================================
   EDU-LINK AI — INTERNSHIPS JS (Explainable AI)
   ============================================ */

let internships = [];
let applications = [];
let currentModalInternship = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!Guard.requireAuth('student')) return;

  Layout.renderDashboard({
    role: 'student',
    activePage: 'internships',
    pageTitle: 'Internships'
  });

  initTabs();
  initModal();

  loadData();
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

/* ---------- LOAD DATA ---------- */
async function loadData() {
  try {
    const matchesData = await API.get('/internship/matches');
    internships = matchesData.internships || [];

    const appsData = await API.get('/internship/my-applications');
    applications = appsData.applications || [];

    renderInternships();
    renderApplications();
  } catch (error) {
    console.error('Load error:', error);
    showAlert(error.message || 'Failed to load internships', 'danger');
  }
}

/* ---------- RENDER INTERNSHIPS ---------- */
function renderInternships() {
  const container = document.getElementById('internshipsList');
  const emptyEl = document.getElementById('internshipsEmpty');
  const countEl = document.getElementById('resultsCount');

  if (!container) return;

  countEl.textContent = `${internships.length} internship${internships.length !== 1 ? 's' : ''} found`;

  if (internships.length === 0) {
    container.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');

  container.innerHTML = internships
    .map((i) => {
      const matchClass = i.match_score >= 70 ? 'high' : i.match_score >= 40 ? 'medium' : 'low';

      return `
        <div class="internship-card">
          <div class="internship-header">
            <div class="internship-info">
              <div class="company-logo">${getInitials(i.company)}</div>
              <div>
                <div class="internship-title">${i.title}</div>
                <div class="internship-company">${i.company}</div>
                <div class="internship-meta">
                  <span><i class="fa-solid fa-location-dot"></i> ${i.location || 'N/A'}</span>
                  <span><i class="fa-solid fa-clock"></i> ${i.duration || 'N/A'}</span>
                  <span><i class="fa-solid fa-indian-rupee-sign"></i> ${i.stipend || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div>
              <div class="match-circle ${matchClass}" style="--score: ${i.match_score}%">
                <span>${i.match_score}%</span>
              </div>
              <div class="match-label">Match</div>
            </div>
          </div>

          <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 12px;">${i.description || ''}</p>

          <div class="internship-skills">
            ${i.matched_skills.slice(0, 5).map((s) => `<span class="skill-chip matched"><i class="fa-solid fa-check"></i> ${s}</span>`).join('')}
            ${i.missing_skills.slice(0, 4).map((s) => `<span class="skill-chip missing"><i class="fa-solid fa-xmark"></i> ${s}</span>`).join('')}
          </div>

          <div class="internship-footer">
            <button class="btn btn-outline btn-sm" onclick="showExplanation(${i.id})">
              <i class="fa-solid fa-circle-info"></i>
              Why this match?
            </button>
            <button class="btn ${i.is_applied ? 'btn-ghost' : 'btn-primary'} btn-sm"
              onclick="applyToInternship(${i.id})" ${i.is_applied ? 'disabled' : ''}>
              ${i.is_applied
                ? '<i class="fa-solid fa-check"></i> Applied'
                : '<i class="fa-solid fa-paper-plane"></i> Apply Now'}
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

/* ---------- EXPLANATION MODAL ---------- */
function initModal() {
  const modal = document.getElementById('explanationModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

async function showExplanation(id) {
  try {
    const data = await API.get(`/internship/${id}/explain`);

    currentModalInternship = data;

    const matchClass = data.match_score >= 70 ? 'high' : data.match_score >= 40 ? 'medium' : 'low';

    const body = document.getElementById('modalBody');
    body.innerHTML = `
      <div class="explanation-score">
        <div class="match-circle ${matchClass}" style="--score: ${data.match_score}%">
          <span>${data.match_score}%</span>
        </div>
        <div>
          <h3>${data.title}</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem;">Match Breakdown</p>
        </div>
      </div>

      <div class="explanation-section">
        <h4>Why this score</h4>
        <ul class="explanation-reasons">
          ${data.reasons.map((r) => `
            <li class="${r.type}">
              <i class="fa-solid ${r.type === 'positive' ? 'fa-circle-check' : r.type === 'negative' ? 'fa-circle-xmark' : 'fa-info-circle'}"></i>
              <span>${r.text}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      ${data.matched_skills.length > 0 ? `
        <div class="explanation-section">
          <h4 style="color: var(--success);">
            <i class="fa-solid fa-circle-check"></i>
            Matched Skills (${data.matched_skills.length})
          </h4>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${data.matched_skills.map((s) => `<span class="skill-chip matched">${s}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${data.missing_skills.length > 0 ? `
        <div class="explanation-section">
          <h4 style="color: var(--danger);">
            <i class="fa-solid fa-circle-xmark"></i>
            Missing Skills (${data.missing_skills.length})
          </h4>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${data.missing_skills.map((s) => `<span class="skill-chip missing">${s}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    `;

    const applyBtn = document.getElementById('modalApplyBtn');
    const isApplied = internships.find((i) => i.id === id)?.is_applied;

    applyBtn.innerHTML = isApplied
      ? '<i class="fa-solid fa-check"></i> Already Applied'
      : '<i class="fa-solid fa-paper-plane"></i> Apply Now';
    applyBtn.disabled = isApplied;
    applyBtn.onclick = () => {
      applyToInternship(id);
      closeModal();
    };

    document.getElementById('explanationModal').classList.remove('hidden');
  } catch (error) {
    showAlert(error.message || 'Failed to load explanation', 'danger');
  }
}

function closeModal() {
  document.getElementById('explanationModal').classList.add('hidden');
  currentModalInternship = null;
}

window.showExplanation = showExplanation;
window.closeModal = closeModal;

/* ---------- APPLY ---------- */
async function applyToInternship(id) {
  try {
    await API.post(`/internship/${id}/apply`);
    showAlert('🎉 Applied successfully!', 'success');

    // Reload data
    setTimeout(() => loadData(), 500);
  } catch (error) {
    showAlert(error.message || 'Failed to apply', 'danger');
  }
}

window.applyToInternship = applyToInternship;

/* ---------- RENDER APPLICATIONS ---------- */
function renderApplications() {
  const container = document.getElementById('applicationsList');
  const emptyEl = document.getElementById('applicationsEmpty');

  if (!container) return;

  if (applications.length === 0) {
    container.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');

  const statusMap = {
    pending: { label: 'Pending', class: 'warning', icon: 'fa-clock' },
    shortlisted: { label: 'Shortlisted', class: 'success', icon: 'fa-circle-check' },
    hired: { label: 'Hired', class: 'primary', icon: 'fa-trophy' },
    rejected: { label: 'Rejected', class: 'danger', icon: 'fa-circle-xmark' }
  };

  container.innerHTML = applications
    .map((app) => {
      const status = statusMap[app.status] || statusMap.pending;

      return `
        <div class="application-item">
          <div class="application-company-logo">${getInitials(app.company)}</div>
          <div class="application-info">
            <div class="application-title">${app.title}</div>
            <div class="application-company">${app.company} · Match: ${app.match_score}%</div>
          </div>
          <span class="badge badge-${status.class}">
            <i class="fa-solid ${status.icon}"></i> ${status.label}
          </span>
        </div>
      `;
    })
    .join('');
}

/* ---------- HELPERS ---------- */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function showAlert(message, type = 'info') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;

  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  setTimeout(() => alertBox.classList.add('hidden'), 4000);
}