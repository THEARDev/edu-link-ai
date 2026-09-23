/* ============================================
   EDU-LINK AI — ROUTE GUARD
   ============================================ */

const Guard = {
  requireAuth(requiredRole = null) {
    const token = API.getToken();
    const role = API.getRole();

    if (!token) {
      window.location.href = '/auth/login.html';
      return false;
    }

    if (requiredRole && role !== requiredRole) {
      this._redirectToCorrectDashboard(role);
      return false;
    }

    return true;
  },

  redirectIfLoggedIn() {
    const token = API.getToken();
    const role = API.getRole();
    if (token && role) {
      this._redirectToCorrectDashboard(role);
      return true;
    }
    return false;
  },

  _redirectToCorrectDashboard(role) {
    const routes = {
      student: '/student/dashboard.html',
      college: '/college/dashboard.html',
      company: '/company/dashboard.html'
    };
    const route = routes[role];
    if (route) window.location.href = route;
  }
};