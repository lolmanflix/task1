import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    // Ask server to clear session cookie, then redirect
    (async () => {
      try {
        await (await import('../utils/api')).api.post('/auth/logout');
      } catch (_) {
        // ignore
      }
      localStorage.removeItem('ems_token');
      localStorage.removeItem('ems_user');
      router.replace('/login');
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-6 bg-white rounded shadow">Logging out…</div>
    </div>
  );
}
