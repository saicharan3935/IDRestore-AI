const API_BASE = '/api';

function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )idrestore_csrf=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : '';
}

function getAuthHeaders(isJson = true) {
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const csrf = getCsrfToken();
  if (csrf) {
    headers['X-CSRF-Token'] = csrf;
  }
  return headers;
}

export const api = {
  // Authentication & Access Control
  async register(email, password, fullName, role = 'HR_ANALYST') {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        role
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid email or password');
    }
    return res.json();
  },

  async logout() {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Logout failed');
    return res.json();
  },

  async getCurrentUser() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Password recovery failed');
    }
    return res.json();
  },

  // System Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`, { credentials: 'include' });
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Dashboard Statistics
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Demo Sample
  async getDemoSample() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/demo-sample`, {
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // AI & CV Analysis
  async analyzeDocument(file = null, documentId = null) {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (documentId) formData.append('document_id', documentId);

    const headers = {};
    const csrf = getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;

    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Analysis failed');
    }
    return res.json();
  },

  // Restoration Execution
  async restoreDocument(file = null, documentId = null, options = {}) {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (documentId) formData.append('document_id', documentId);
    formData.append('options', JSON.stringify(options));

    const headers = {};
    const csrf = getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;

    const res = await fetch(`${API_BASE}/restore`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Restoration failed');
    }
    return res.json();
  },

  // Document History
  async getHistory(search = '', status = 'ALL', limit = 50, offset = 0) {
    const params = new URLSearchParams({ limit, offset });
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);

    const res = await fetch(`${API_BASE}/history?${params.toString()}`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  async getDocumentDetail(id) {
    const res = await fetch(`${API_BASE}/history/${id}`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch document detail');
    return res.json();
  },

  async deleteDocument(id) {
    const res = await fetch(`${API_BASE}/history/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(true),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  async bulkDelete(ids) {
    const res = await fetch(`${API_BASE}/history/bulk-delete`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(ids),
    });
    if (!res.ok) throw new Error('Failed to bulk delete');
    return res.json();
  },

  // Batch Processing
  async createBatch(files, batchName = 'HR_Batch', options = {}) {
    const formData = new FormData();
    formData.append('batch_name', batchName);
    formData.append('options', JSON.stringify(options));
    for (const f of files) {
      formData.append('files', f);
    }

    const headers = {};
    const csrf = getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;

    const res = await fetch(`${API_BASE}/batch`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Batch creation failed');
    }
    return res.json();
  },

  async getBatchStatus(batchId) {
    const res = await fetch(`${API_BASE}/batch/${batchId}`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch batch status');
    return res.json();
  },

  // Settings & Models
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async getModels() {
    const res = await fetch(`${API_BASE}/models`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch model registry');
    return res.json();
  },

  async updateGeminiKey(key) {
    const res = await fetch(`${API_BASE}/settings/gemini-key`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ gemini_api_key: key }),
    });
    if (!res.ok) throw new Error('Failed to update API key');
    return res.json();
  },
};
