/* ============================================
   EDU-LINK AI — API WRAPPER
   All fetch calls go through here
   ============================================ */

const API = {
  /**
   * Get stored JWT token
   */
  getToken() {
    return localStorage.getItem(CONFIG.STORAGE.TOKEN);
  },

  /**
   * Get stored user object
   */
  getUser() {
    const user = localStorage.getItem(CONFIG.STORAGE.USER);
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get stored role
   */
  getRole() {
    return localStorage.getItem(CONFIG.STORAGE.ROLE);
  },

  /**
   * Save auth data after login/signup
   */
  saveAuth(token, user, role) {
    localStorage.setItem(CONFIG.STORAGE.TOKEN, token);
    localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(user));
    localStorage.setItem(CONFIG.STORAGE.ROLE, role);
  },

  /**
   * Clear auth data on logout
   */
  clearAuth() {
    localStorage.removeItem(CONFIG.STORAGE.TOKEN);
    localStorage.removeItem(CONFIG.STORAGE.USER);
    localStorage.removeItem(CONFIG.STORAGE.ROLE);
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return !!this.getToken();
  },

  /**
   * Core request method
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      isFormData = false
    } = options;

    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const finalHeaders = { ...headers };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Content-Type only if not FormData
    if (!isFormData && body) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    const fetchConfig = {
      method,
      headers: finalHeaders
    };

    if (body) {
      fetchConfig.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchConfig);

      // Handle 401 — token expired
      if (response.status === 401) {
        this.clearAuth();
        const path = window.location.pathname;
        if (!path.includes('/auth/')) {
          window.location.href = '/auth/login.html';
        }
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || `Request failed (${response.status})`);
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please check your connection.');
      }
      throw error;
    }
  },

  // ---------- HTTP SHORTCUTS ----------
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  /**
   * Upload file (FormData)
   */
  upload(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  }
};