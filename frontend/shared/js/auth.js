/* ============================================
   EDU-LINK AI — AUTH HELPERS
   ============================================ */

const Auth = {
  async login(email, password) {
    const data = await API.post('/auth/login', { email, password });
    if (data.token && data.user) {
      API.saveAuth(data.token, data.user, data.user.role);
      return data;
    }
    throw new Error('Invalid response from server');
  },

  async signup(payload) {
    const data = await API.post('/auth/signup', payload);
    if (data.token && data.user) {
      API.saveAuth(data.token, data.user, data.user.role);
      return data;
    }
    throw new Error('Invalid response from server');
  },

  logout() {
    API.clearAuth();
    window.location.href = '/index.html';
  },

  currentUser() { return API.getUser(); },
  currentRole() { return API.getRole(); },
  isLoggedIn() { return API.isLoggedIn(); },

  redirectToDashboard(role) {
    const routes = {
      student: '/student/dashboard.html',
      college: '/college/dashboard.html',
      company: '/company/dashboard.html'
    };
    const route = routes[role];
    if (route) window.location.href = route;
  }
};