/* ============================================
   EDU-LINK AI — CAREER INSIGHTS JS
   ============================================ */

const ROLE_SKILLS = {
  fullstack: {
    name: 'Full Stack Developer',
    description: 'Build end-to-end web applications',
    icon: 'fa-solid fa-layer-group',
    required: ['JavaScript', 'React', 'Node.js', 'SQL', 'MongoDB', 'Git', 'Docker', 'REST APIs', 'AWS', 'TypeScript']
  },
  datascientist: {
    name: 'Data Scientist',
    description: 'Extract insights from data using ML',
    icon: 'fa-solid fa-chart-line',
    required: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'NumPy', 'TensorFlow', 'Data Visualization']
  },
  frontend: {
    name: 'Frontend Developer',
    description: 'Build user interfaces for the web',
    icon: 'fa-solid fa-palette',
    required: ['HTML/CSS', 'JavaScript', 'React', 'TypeScript', 'Git', 'Responsive Design', 'Figma']
  },
  backend: {
    name: 'Backend Developer',
    description: 'Build server-side logic and APIs',
    icon: 'fa-solid fa-server',
    required: ['Node.js', 'Python', 'SQL', 'MongoDB', 'REST APIs', 'Docker', 'Git', 'AWS']
  },
  ml: {
    name: 'Machine Learning Engineer',
    description: 'Deploy ML models to production',
    icon: 'fa-solid fa-robot',
    required: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Docker']
  }
};

let currentRole = 'fullstack';
let studentSkills = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!Guard.requireAuth('student')) return;

  Layout.renderDashboard({
    role: 'student',
    activePage: 'insights',
    pageTitle: 'Career Insights'
  });

  initTabs();
  initRoleSelector();
  loadInsights();
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

/* ---------- ROLE SELECTOR ---------- */
function initRoleSelector() {
  const select = document.getElementById('targetRoleSelect');
  if (!select) return;

  select.addEventListener('change', (e) => {
    currentRole = e.target.value;
    renderGapAnalysis();
  });
}

/* ---------- LOAD INSIGHTS ---------- */
async function loadInsights() {
  try {
    const data = await API.get('/student/skills');
    studentSkills = data.skills || [];

    renderGapAnalysis();
    renderCareers();
    renderReadiness();
  } catch (error) {
    console.error('Insights load error:', error);
  }
}

/* ---------- GAP ANALYSIS ---------- */
function renderGapAnalysis() {
  const role = ROLE_SKILLS[currentRole];
  if (!role) return;

  const studentSkillNames = studentSkills.map((s) => s.name.toLowerCase());

  const matched = [];
  const missing = [];

  role.required.forEach((skill) => {
    if (studentSkillNames.includes(skill.toLowerCase())) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  document.getElementById('matchedCount').textContent = matched.length;
  document.getElementById('missingCount').textContent = missing.length;

  const percent = Math.round((matched.length / role.required.length) * 100);
  document.getElementById('matchPercent').textContent = percent + '%';

  renderSkillsList('matchedSkillsList', matched, 'matched');
  renderSkillsList('missingSkillsList', missing, 'missing');
}

function renderSkillsList(elementId, skills, type) {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (skills.length === 0) {
    el.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No skills in this category.</p>`;
    return;
  }

  el.innerHTML = skills
    .map((skill) => `<span class="skill-chip ${type}">${skill}</span>`)
    .join('');
}

/* ---------- CAREERS ---------- */
function renderCareers() {
  const container = document.getElementById('careersGrid');
  if (!container) return;

  const studentSkillNames = studentSkills.map((s) => s.name.toLowerCase());

  const careers = Object.entries(ROLE_SKILLS).map(([key, role]) => {
    const matchedCount = role.required.filter((r) =>
      studentSkillNames.includes(r.toLowerCase())
    ).length;

    const matchScore = Math.round((matchedCount / role.required.length) * 100);

    return { key, ...role, matchScore };
  });

  careers.sort((a, b) => b.matchScore - a.matchScore);

  container.innerHTML = careers
    .map((career) => `
      <div class="career-card">
        <div class="career-card-header">
          <div class="career-icon">
            <i class="${career.icon}"></i>
          </div>
          <div style="text-align: right;">
            <div class="career-match-value">${career.matchScore}%</div>
            <div class="career-match-label">Match</div>
          </div>
        </div>
        <h3>${career.name}</h3>
        <p>${career.description}</p>
        <div class="career-skills">
          ${career.required.slice(0, 5).map((s) => `<span class="skill-chip">${s}</span>`).join('')}
        </div>
      </div>
    `)
    .join('');
}

/* ---------- READINESS ---------- */
function renderReadiness() {
  const user = API.getUser() || {};

  // Skills score — 4% per skill, max 100
  const skillsScore = Math.min(studentSkills.length * 4, 100);

  // Profile completeness
  let profileFields = 0;
  const totalFields = 7;
  if (user.name) profileFields++;
  if (user.email) profileFields++;
  if (user.phone) profileFields++;
  if (user.college_name) profileFields++;
  if (user.branch) profileFields++;
  if (user.year) profileFields++;
  if (user.cgpa) profileFields++;
  const profileScore = Math.round((profileFields / totalFields) * 100);

  // Experience (placeholder)
  const experienceScore = 0;

  // Overall weighted
  const overall = Math.round(
    (skillsScore * 0.5) + (profileScore * 0.3) + (experienceScore * 0.2)
  );

  const ring = document.getElementById('readinessRingBig');
  const scoreEl = document.getElementById('readinessScoreBig');
  if (ring) ring.style.setProperty('--score', `${overall}%`);
  if (scoreEl) scoreEl.textContent = `${overall}%`;

  document.getElementById('breakdownSkills').textContent = `${skillsScore}%`;
  document.getElementById('breakdownProfile').textContent = `${profileScore}%`;
  document.getElementById('breakdownExperience').textContent = `${experienceScore}%`;
}