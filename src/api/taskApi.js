const BASE = import.meta.env.VITE_API_URL + '/api/v1'

const getToken = () => localStorage.getItem('jwt_token')

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

export const authApi = {
  register: (data) =>
    fetch(`${BASE}/auth/register`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(r => r.json()),
  login: (data) =>
    fetch(`${BASE}/auth/login`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(r => r.json()),
  me: () =>
    fetch(`${BASE}/auth/me`, { headers: headers() }).then(r => r.json()),
}

export const tasksApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return fetch(`${BASE}/tasks${params ? '?' + params : ''}`, { headers: headers() }).then(r => r.json())
  },
  create: (data) =>
    fetch(`${BASE}/tasks`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(r => r.json()),
  update: (id, data) =>
    fetch(`${BASE}/tasks/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }).then(r => r.json()),
  delete: (id) =>
    fetch(`${BASE}/tasks/${id}`, { method: 'DELETE', headers: headers() }).then(r => r.json()),
}

export const adminApi = {
  getUsers: () =>
    fetch(`${BASE}/tasks/admin/users`, { headers: headers() }).then(r => r.json()),
}