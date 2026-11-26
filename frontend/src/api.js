const API = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api`
async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}
export const api = {
  dashboard: () => request('/dashboard'),
  bins: () => request('/bins'),
  addBin: (body) => request('/bins', { method: 'POST', body: JSON.stringify(body) }),
  updateBin: (id, body) => request(`/bins/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBin: (id) => request(`/bins/${id}`, { method: 'DELETE' }),
  collections: () => request('/collections'),
  addCollection: (body) => request('/collections', { method: 'POST', body: JSON.stringify(body) }),
  updateCollection: (id, status) => request(`/collections/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  records: () => request('/waste-records'),
  alerts: () => request('/alerts'),
}
