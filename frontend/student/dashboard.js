/* ============================================
   EDU-LINK AI — STUDENT DASHBOARD JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!Guard.requireAuth('student')) return;

  Layout.renderDashboard({
    role: 'student',
    activePage: 'dashboard',
    pageTitle: 'Dashboard'
  });

  loadDashboard();
});

async function loadDashboard() {
  const user = API.getUser();

  // Welcome message
  if (user && user.name) {
    const firstName = user.name.split(' ')[0];
    const title = document.getElementById('welcomeTitle');
    if (title) title.textContent = `Welcome back, ${firstName}! 👋`;
  }

  try {
    // Load dashboard data
    const data = await API.get('/student/dashboard');

    document.getElementById('statSkills').textContent = data.stats.totalSkills || 0;
    document.getElementById('statMatches').textContent = data.stats.internshipMatches || 0;
    document.getElementById('statReadiness').textContent = (data.stats.readinessScore || 0) + '%';
    document.getElementById('statApplications').textContent = data.stats.applications || 0;

    renderSkills(data.skills || []);
  } catch (error) {
    console.error('Dashboard load error:', error);
  }

  // Load real counts
  try {
    const skillsData = await API.get('/student/skills');
    const skills = skillsData.skills || [];
    document.getElementById('statSkills').textContent = skills.length;
    renderSkills(skills);
  } catch (e) {
    console.log('Skills load skipped');
  }

  // Load applications count
  try {
    const appsData = await API.get('/internship/my-applications');
    const apps = appsData.applications || [];
    document.getElementById('statApplications').textContent = apps.length;
  } catch (e) {
    console.log('Applications load skipped');
  }

  // Load internship matches count
  try {
    const matchesData = await API.get('/internship/matches');
    const matches = matchesData.internships || [];
    const goodMatches = matches.filter((m) => m.match_score >= 50).length;
    document.getElementById('statMatches').textContent = goodMatches;
  } catch (e) {
    console.log('Matches load skipped');
  }

  // Calculate readiness
  try {
    const skillsData = await API.get('/student/skills');
    const skills = skillsData.skills || [];

    const skillsScore = Math.min(skills.length * 5, 100);
    let profileFields = 0;
    if (user.name) profileFields++;
    if (user.email) profileFields++;
    if (user.phone) profileFields++;
    if (user.college_name) profileFields++;
    if (user.branch) profileFields++;
    if (user.year) profileFields++;
    if (user.cgpa) profileFields++;

    const profileScore = Math.round((profileFields / 7) * 100);
    const readiness = Math.round((skillsScore * 0.6) + (profileScore * 0.4));

    document.getElementById('statReadiness').textContent = readiness + '%';
  } catch (e) {
    console.log('Readiness load skipped');
  }
}

function renderSkills(skills) {
  const container = document.getElementById('skillsPreview');
  if (!container) return;

  if (!skills || skills.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <i class="fa-solid fa-lightbulb"></i>
        <p>No skills added yet. Upload your resume to get started.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = skills
    .map((skill) => `<span class="skill-chip">${skill.name}</span>`)
    .join('');
}