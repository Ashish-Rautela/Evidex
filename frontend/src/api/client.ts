const fetchApi = async (path: string, options: RequestInit, isAuthService = false) => {
  const mainApiUrl = import.meta.env.VITE_API_URL || localStorage.getItem('api_url') || '';

  // ponytail: local dev uses standalone auth-service on :5001; production routes auth through the same API Gateway
  const isLocalDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const baseUrl = isAuthService
    ? (import.meta.env.VITE_AUTH_URL || localStorage.getItem('auth_url') || (isLocalDev ? 'http://localhost:5001' : mainApiUrl))
    : mainApiUrl;

  const token = localStorage.getItem('id_token');
  const userProfileRaw = localStorage.getItem('user_profile');
  let userProfile: any = null;
  if (userProfileRaw) {
    try { userProfile = JSON.parse(userProfileRaw); } catch { /* ignore */ }
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (userProfile?.tenantId) {
    headers['x-tenant-id'] = userProfile.tenantId;
  }
  if (userProfile?.id) {
    headers['x-user-id'] = userProfile.id;
  }

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const requestUrl = cleanBase ? `${cleanBase}${cleanPath}` : cleanPath;

  const res = await fetch(requestUrl, { ...options, headers: { ...headers, ...options.headers } });
  
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errBody.message || errBody.error || res.statusText || `Request failed (${res.status})`);
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

export const authApiClient = {
  post: (path: string, body: any) => fetchApi(path, { method: 'POST', body: JSON.stringify(body) }, true),
  get: (path: string) => fetchApi(path, { method: 'GET' }, true),
};
