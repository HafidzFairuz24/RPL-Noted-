
const API_BASE = 'https://rpl-noted-production.up.railway.app/api';

// ── Token helpers ────────────────────────────────────────────
const Auth = {
    getToken: ()       => localStorage.getItem('noted_token'),
    setToken: (token)  => localStorage.setItem('noted_token', token),
    getUser:  ()       => JSON.parse(localStorage.getItem('noted_user') || 'null'),
    setUser:  (user)   => localStorage.setItem('noted_user', JSON.stringify(user)),
    logout:   ()       => { localStorage.removeItem('noted_token'); localStorage.removeItem('noted_user'); window.location.href = 'login.html'; },
    isLoggedIn: ()     => !!localStorage.getItem('noted_token'),
};

// ── Core fetch wrapper ───────────────────────────────────────
async function apiRequest(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

const get    = (url)        => apiRequest('GET',    url);
const post   = (url, body)  => apiRequest('POST',   url, body);
const put    = (url, body)  => apiRequest('PUT',    url, body);
const del    = (url)        => apiRequest('DELETE', url);

// ── Auth API ─────────────────────────────────────────────────
const AuthAPI = {
    register: (data) => post('/auth/register', data),
    login:    (data) => post('/auth/login',    data),
    me:       ()     => get('/auth/me'),
    updateProfile: (data) => put('/auth/profile', data),
};

// ── Workspace API ─────────────────────────────────────────────
const WorkspaceAPI = {
    getAll:        ()           => get('/workspaces'),
    getOne:        (id)         => get(`/workspaces/${id}`),
    create:        (data)       => post('/workspaces', data),
    update:        (id, data)   => put(`/workspaces/${id}`, data),
    delete:        (id)         => del(`/workspaces/${id}`),
    addMember:     (id, email)  => post(`/workspaces/${id}/members`, { email }),
    removeMember:  (id, userId) => del(`/workspaces/${id}/members/${userId}`),
};

// ── List API ──────────────────────────────────────────────────
const ListAPI = {
    getAll:  (workspaceId)        => get(`/workspaces/${workspaceId}/lists`),
    getOne:  (workspaceId, id)    => get(`/workspaces/${workspaceId}/lists/${id}`),
    create:  (workspaceId, data)  => post(`/workspaces/${workspaceId}/lists`, data),
    update:  (workspaceId, id, data) => put(`/workspaces/${workspaceId}/lists/${id}`, data),
    delete:  (workspaceId, id)    => del(`/workspaces/${workspaceId}/lists/${id}`),
};

// ── Task API ──────────────────────────────────────────────────
const TaskAPI = {
    getAll:  (listId)        => get(`/lists/${listId}/tasks`),
    getOne:  (listId, id)    => get(`/lists/${listId}/tasks/${id}`),
    create:  (listId, data)  => post(`/lists/${listId}/tasks`, data),
    update:  (listId, id, data) => put(`/lists/${listId}/tasks/${id}`, data),
    delete:  (listId, id)    => del(`/lists/${listId}/tasks/${id}`),
};

// ── Comment API ───────────────────────────────────────────────
const CommentAPI = {
    add:    (listId, taskId, content)       => post(`/lists/${listId}/tasks/${taskId}/comments`, { content }),
    update: (listId, taskId, commentId, content) => put(`/lists/${listId}/tasks/${taskId}/comments/${commentId}`, { content }),
    delete: (listId, taskId, commentId)     => del(`/lists/${listId}/tasks/${taskId}/comments/${commentId}`),
};

// ── Notification API ──────────────────────────────────────────
const NotificationAPI = {
    getAll:      ()   => get('/notifications'),
    markRead:    (id) => put(`/notifications/${id}/read`),
    markAllRead: ()   => put('/notifications/read-all'),
    delete:      (id) => del(`/notifications/${id}`),
};

// ── Guard: redirect to login if not authenticated ─────────────
function requireAuth() {
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// ── Show API error in UI ──────────────────────────────────────
function showError(message, containerId = 'error-msg') {
    const el = document.getElementById(containerId);
    if (el) { el.textContent = message; el.style.display = 'block'; }
    else alert(message);
}
