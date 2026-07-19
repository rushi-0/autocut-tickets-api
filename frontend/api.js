// Centralized API helpers
// NOTE: Backend runs on http://localhost:6000
const API_BASE_URL = 'http://localhost:6000';

async function requestJson(path, { method = 'GET', token = null, body = null, headers = {} } = {}){
  const h = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if(token){
    h['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if(!res.ok){
    // Standardize error message
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

async function requestForm(path, { method = 'POST', token = null, formData, headers = {} } = {}){
  const h = {
    ...headers,
  };

  if(token){
    h['Authorization'] = `Bearer ${token}`;
  }

  // Do NOT set Content-Type for FormData (browser adds boundary)
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: h,
    body: formData
  });

  const data = await res.json().catch(() => ({}));
  if(!res.ok){
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

const api = {
  register: async ({name,email,password}) => {
    return requestJson('/api/auth/register', {
      method: 'POST',
      body: { name, email, password }
    });
  },

  login: async ({email,password}) => {
    return requestJson('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },

  createTicket: async ({token, title, description, attachmentFile}) => {
    const fd = new FormData();
    fd.append('title', title);
    fd.append('description', description);
    // Backend expects upload.single('attachment') => field name must be exactly 'attachment'
    if(attachmentFile) fd.append('attachment', attachmentFile);

    return requestForm('/api/tickets', {
      method: 'POST',
      token,
      formData: fd
    });
  },

  getTickets: async ({token, page=1, limit=20}) => {
    return requestJson(`/api/tickets?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}` , {
      method: 'GET',
      token
    });
  }
};

export { api };

