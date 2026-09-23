/* ============================================
   EDU-LINK AI — LAYOUT INJECTOR
   ============================================ */

const Layout = {
  renderDashboard(options = {}) {
    const { role, activePage, pageTitle } = options;

    const user = API.getUser() || { name: 'User', email: '' };
    const initials = this._getInitials(user.name);

    const menus = this._getMenuItems(role);

    // Sidebar HTML
    const sidebarHTML = `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
          <span>Edu-Link <strong>AI</strong></span>
        </div>

        <nav class="sidebar-nav">
          ${menus.map(item => `
            <a href="${item.href}" class="sidebar-nav-item ${item.key === activePage ? 'active' : ''}">
              <i class="${item.icon}"></i>
              <span>${item.label}</span>
            </a>
          `).join('')}
        </nav>

        <div class="sidebar-footer">
          <button class="btn btn-ghost btn-block btn-sm" onclick="Auth.logout()">
            <i class="fa-solid fa-right-from-bracket"></i>
            Logout
          </button>
        </div>
      </aside>
    `;

    // Topbar HTML
    const topbarHTML = `
      <header class="topbar">
        <div class="flex" style="align-items: center; gap: 12px;">
          <button class="sidebar-toggle" onclick="Layout.toggleSidebar()">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div class="topbar-title">${pageTitle || 'Dashboard'}</div>
        </div>

        <div class="topbar-actions">
          <div class="topbar-user">
            <div class="topbar-user-avatar">${initials}</div>
            <span>${user.name || 'User'}</span>
          </div>
        </div>
      </header>
    `;

    const appLayout = document.getElementById('app-layout');
    if (appLayout) {
      appLayout.insertAdjacentHTML('afterbegin', sidebarHTML);
      const mainContent = appLayout.querySelector('.main-content');
      if (mainContent) {
        mainContent.insertAdjacentHTML('afterbegin', topbarHTML);
      }
    }
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
  },

  _getInitials(name) {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  _getMenuItems(role) {
    const studentMenu = [
      { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high', href: '/student/dashboard.html' },
      { key: 'profile', label: 'My Profile', icon: 'fa-solid fa-user', href: '/student/profile.html' },
      { key: 'insights', label: 'Career Insights', icon: 'fa-solid fa-chart-line', href: '/student/insights.html' },
      { key: 'internships', label: 'Internships', icon: 'fa-solid fa-briefcase', href: '/student/internships.html' }
    ];

    const collegeMenu = [
      { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high', href: '/college/dashboard.html' }
    ];

    const companyMenu = [
      { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high', href: '/company/dashboard.html' },
      { key: 'post', label: 'Post Internship', icon: 'fa-solid fa-plus', href: '/company/post-internship.html' }
    ];

    const menus = {
      student: studentMenu,
      college: collegeMenu,
      company: companyMenu
    };

    return menus[role] || [];
  }
};