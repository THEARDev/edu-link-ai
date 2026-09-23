/* ============================================
   EDU-LINK AI — COMPANY DASHBOARD JS
   ============================================ */

let candidates = [];
let filteredCandidates = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!Guard.requireAuth('company')) return;

  Layout.renderDashboard({
    role: 'company',
    activePage: 'dashboard',
    pageTitle: 'Company Dashboard'
  });

  initWelcome();
  initFilters();
  loadData();
});

/* ---------- WELCOME ---------- */
function initWelcome() {
  const user = API.getUser();
  if (user && user.name) {
    const title = document.getElementById('welcomeTitle');
    if (title) title.textContent = `Welcome, ${user.name}! 🏢`;
  }
}

/* ---------- LOAD DATA ---------- */
async function loadData() {
  try {
    // Stats
    const statsData = await API.get('/company/stats');
    const stats = statsData.stats || {};

    document.getElementById('statInternships').textContent = stats.activeInternships || 0;
    document.getElementById('statApplications').textContent = stats.totalApplications || 0;
    document.getElementById('statShortlisted').textContent = stats.shortlisted || 0;
    document.getElementById('statHired').textContent = stats.hired || 0;

    // Candidates
    const candidatesData = await API.get('/company/candidates');
    candidates = candidatesData.candidates || [];
    filteredCandidates = [...candidates];

    renderCandidates();
  } catch (error) {
    console.error('Load error:', error);
    showAlert(error.message || 'Failed to load data', 'danger');
  }
}

/* ---------- FILTERS ---------- */
function initFilters() {
  const search = document.getElementById('searchCandidates');
  if (search) {
    search.addEventListener('input', applyFilters);
  }
}

function applyFilters() {
  const query = document.getElementById('searchCandidates').value.toLowerCase().trim();

  filteredCandidates = candidates.filter((c) => {
    if (query && !c.name.toLowerCase().includes(query) && !c.email.toLowerCase().includes(query)) return false;
    return true;
  });

  renderCandidates();
}

/* ---------- RENDER CANDIDATES ---------- */
function renderCandidates() {
  const container = document.getElementById('candidatesList');
  const emptyEl = document.getElementById('candidatesEmpty');
  const countEl = document.getElementById('candidatesCount');

  if (!container) return;

  countEl.textContent = `${filteredCandidates.length} candidate${filteredCandidates.length !== 1 ? 's' : ''}`;

  if (filteredCandidates.length === 0) {
    container.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');

  container.innerHTML = filteredCandidates
    .map((c) => {
      const initials = c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
      const matchClass = c.match_score >= 70 ? 'success' : c.match_score >= 40 ? 'warning' : 'danger';
      const skills = c.skills || [];

      const statusBadge = {
        'shortlisted': '<span class="badge badge-warning"><i class="fa-solid fa-star"></i> Shortlisted</span>',
        'hired': '<span class="badge badge-success"><i class="fa-solid fa-trophy"></i> Hired</span>',
        'rejected': '<span class="badge badge-danger">Rejected</span>',
        'pending': '<span class="badge badge-info">Pending</span>'
      }[c.status] || '<span class="badge badge-muted">New</span>';

      return `
        <div class="candidate-item">
          <div class="candidate-avatar">${initials}</div>
          <div class="candidate-info">
            <div class="candidate-name">${c.name}</div>
            <div class="candidate-meta">
              <span><i class="fa-solid fa-graduation-cap"></i> ${c.college_name || 'N/A'}</span>
              <span><i class="fa-solid fa-book"></i> ${c.branch || 'N/A'}${c.year ? ' · Year ' + c.year : ''}</span>
              ${c.cgpa ? `<span><i class="fa-solid fa-star"></i> CGPA ${c.cgpa}</span>` : ''}
            </div>
            <div class="candidate-skills">
              ${skills.slice(0, 5).map((s) => `<span class="skill-chip">${s.name}</span>`).join('')}
              ${skills.length === 0 ? '<span style="color: var(--text-dim); font-size: 0.75rem;">No skills yet</span>' : ''}
            </div>
          </div>
          <div class="candidate-match">
            <div class="candidate-match-score text-${matchClass}">${c.match_score}%</div>
            <div class="candidate-match-label">Match</div>
          </div>
          <div class="candidate-status">
            ${statusBadge}
            <div class="candidate-actions">
              <button class="btn btn-ghost btn-sm" onclick="shortlistCandidate(${c.id})" title="Shortlist">
                <i class="fa-solid fa-star"></i>
              </button>
              <button class="btn btn-primary btn-sm" onclick="hireCandidate(${c.id})" title="Hire">
                <i class="fa-solid fa-check"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

/* ---------- ACTIONS ---------- */
async function shortlistCandidate(id) {
  try {
    await API.post(`/company/candidates/${id}/shortlist`);
    showAlert('Candidate shortlisted!', 'success');
    loadData();
  } catch (error) {
    showAlert(error.message || 'Failed to shortlist', 'danger');
  }
}

async function hireCandidate(id) {
  try {
    await API.post(`/company/candidates/${id}/hire`);
    showAlert('🎉 Candidate hired!', 'success');
    loadData();
  } catch (error) {
    showAlert(error.message || 'Failed to hire', 'danger');
  }
}

window.shortlistCandidate = shortlistCandidate;
window.hireCandidate = hireCandidate;

/* ---------- HELPERS ---------- */
function showAlert(message, type = 'info') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;

  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove('hidden');

  setTimeout(() => alertBox.classList.add('hidden'), 4000);
}