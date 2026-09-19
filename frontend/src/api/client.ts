const fetchApi = async (path: string, options: RequestInit) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('id_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errBody.message || 'API request failed');
  }
  
  // Handle empty responses
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};

export const apiClient = {
  get: (path: string) => fetchApi(path, { method: 'GET' }),
  post: (path: string, body: any) => fetchApi(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: (path: string) => fetchApi(path, { method: 'DELETE' }),
  putDirect: async (url: string, body: File, contentType: string) => {
    const res = await fetch(url, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': contentType }
    });
    if (!res.ok) throw new Error('Direct upload failed');
    return res;
  }
};
