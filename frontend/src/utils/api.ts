import axios from 'axios';

// Use same-origin relative path so Next.js dev server can proxy to the backend.
// This keeps requests same-site and ensures httpOnly cookies are included reliably.
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// include credentials so httpOnly cookie auth works (server sets cookie)
export const api = axios.create({ baseURL: API_URL, withCredentials: true });

// We no longer rely on localStorage-stored tokens; API requests use cookie sessions.
export function authHeader() {
  return {};
}

// read cookie helper
function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined;
  const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return v ? v.pop() : undefined;
}

// attach CSRF token from cookie for state-changing requests
api.interceptors.request.use((config) => {
  try {
    // If the request is not GET, add CSRF header from cookie
    if (config && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
      const csrf = getCookie('XSRF-TOKEN');
      if (csrf) (config.headers as any)['x-csrf-token'] = csrf;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// response interceptor: try refresh once on 401 then retry original request
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response && err.response.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(original);
      } catch (e) {
        // still unauthorized — forward
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);
