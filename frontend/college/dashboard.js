/* ============================================
   EDU-LINK AI — COLLEGE DASHBOARD JS
   ============================================ */

let students = [];
let filteredStudents = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!Guard.requireAuth('college')) return;

  Layout.renderDashboard({
    role: 'college',
    activePage: 'dashboard',
    pageTitle: 'College Dashboard'
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
    if (title) title.textContent = `Welcome, ${user.name}! 🏛️`;
  }
}

/* ---------- LOAD DATA ---------- */
async function loadData() {
  try {
    // Stats
    const statsData = await API.get('/college/stats');
    const stats = statsData.stats || {};

    document.getElementById('statTotalStudents').textContent = stats.totalStudents || 0;
    document.getElementById('statPlaced').textContent = stats.placed || 0;
    document.getElementById('statAvgReadiness').textContent = (stats.avgReadiness || 0) + '%';
    document.getElementById('statActiveInternships').textContent = stats.activeInternships || 0;

    // Students
    const studentsData = await API.get('/college/students');
    students = studentsData.students || [];
    filteredStudents = [...students];

    renderStudentsTable();

    // Top skills
    const analyticsData = await API.get('/college/analytics');
    renderTopSkills(analyticsData.topSkills || []);
  } catch (error) {
    console.error('Load error:', error);
    showAlert(error.message || 'Failed to load data', 'danger');
  }
}

/* ---------- TOP SKILLS ---------- */
function renderTopSkills(topSkills) {
  const container = document.getElementById('topSkills');
  if (!container) return;

  if (topSkills.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <p>No skills data yet. Students need to add skills.</p>
      </div>
    `;
    return;
  }

  const maxCount = topSkills[0].count;

  container.innerHTML = topSkills
    .map((skill) => {
      const width = Math.round((skill.count / maxCount) * 100);
      return `
        <div class="top-skill-row">
          <div class="top-skill-name">${skill.name}</div>
          <div class="top-skill-bar-wrapper">
            <div class="top-skill-bar" style="width: ${width}%"></div>
          </div>
          <div class="top-skill-count">${skill.count} students</div>
        </div>
      `;
    })
    .join('');
}

/* ---------- FILTERS ---------- */
function initFilters() {
  const search = document.getElementById('searchStudents');
  if (search) {
    search.addEventListener('input', applyFilters);
  }
}

function applyFilters() {
  const query = document.getElementById('searchStudents').value.toLowerCase().trim();

  filteredStudents = students.filter((s) => {
    if (query && !s.name.toLowerCase().includes(query) && !s.email.toLowerCase().includes(query)) return false;
    return true;
  });

  renderStudentsTable();
}

/* ---------- RENDER TABLE ---------- */
function renderStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  const emptyEl = document.getElementById('studentsEmpty');
  const countEl = document.getElementById('studentsCount');

  if (!tbody) return;

  countEl.textContent = `${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`;

  if (filteredStudents.length === 0) {
    tbody.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');

  const branchMap = {
    cse: 'CSE', it: 'IT', ece: 'ECE', mech: 'MECH', civil: 'CIVIL'
  };

  tbody.innerHTML = filteredStudents
    .map((s) => {
      const initials = s.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
      const skills = s.skills || [];
      const readClass = s.readiness >= 70 ? 'success' : s.readiness >= 40 ? 'warning' : 'danger';
      const statusClass = s.status === 'Interned' ? 'success' : 'muted';
      const statusIcon = s.status === 'Interned' ? 'fa-briefcase' : 'fa-magnifying-glass';

      return `
        <tr>
          <td>
            <div class="student-cell">
              <div class="student-avatar">${initials}</div>
              <div>
                <div class="student-name">${s.name}</div>
                <div class="student-email">${s.email}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-muted">${branchMap[s.branch] || s.branch || '-'}</span></td>
          <td>${s.year ? 'Year ' + s.year : '-'}</td>
          <td>
            <div class="skills-mini">
              ${skills.slice(0, 3).map((sk) => `<span class="skill-mini-chip">${sk.name}</span>`).join('')}
              ${skills.length === 0 ? '<span style="color: var(--text-dim); font-size: 0.8rem;">No skills</span>' : ''}
            </div>
          </td>
          <td>
            <div class="readiness-mini">
              <div class="progress">
                <div class="progress-bar ${readClass}" style="width: ${s.readiness}%"></div>
              </div>
              <span>${s.readiness}%</span>
            </div>
          </td>
          <td>
            <span class="badge badge-${statusClass}">
              <i class="fa-solid ${statusIcon}"></i> ${s.status}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');
}

/* ---------- HELPERS ---------- */
function showAlert(message, type = 'info') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;

  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove('hidden');

  setTimeout(() => alertBox.classList.add('hidden'), 4000);
}