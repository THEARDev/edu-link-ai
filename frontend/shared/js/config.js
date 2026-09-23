/* ============================================
   EDU-LINK AI — CONFIG
   ============================================ */

const CONFIG = {
  API_BASE_URL: 'http://127.0.0.1:5000/api',
  APP_NAME: 'Edu-Link AI',
  APP_TAGLINE: 'Connecting Talent, Academia and Industry',

  STORAGE: {
    TOKEN: 'edulink_token',
    USER: 'edulink_user',
    ROLE: 'edulink_role'
  },

  ROLES: {
    STUDENT: 'student',
    COLLEGE: 'college',
    COMPANY: 'company'
  },

  DASHBOARD_ROUTES: {
    student: '/student/dashboard.html',
    college: '/college/dashboard.html',
    company: '/company/dashboard.html'
  },

  LOGIN_ROUTE: '/auth/login.html'
};

Object.freeze(CONFIG);
Object.freeze(CONFIG.STORAGE);
Object.freeze(CONFIG.ROLES);
Object.freeze(CONFIG.DASHBOARD_ROUTES);