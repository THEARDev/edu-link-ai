// FORCE DEPLOY v3 - 24 Sep 2026
/* ============================================
   EDU-LINK AI — CONFIG
   ============================================ */

const CONFIG = {
  // Backend API base URL — Render production
  API_BASE_URL: 'https://edu-link-backend-olrt.onrender.com/api',

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