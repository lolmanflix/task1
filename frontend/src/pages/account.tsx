import ProtectedRoute from '../components/ProtectedRoute';
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import Link from 'next/link';

export default function Account() {
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (mounted) setUser(data.admin || null);
      } catch (err) {
        if (mounted) setUser(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded shadow flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {user?.email ? user.email.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Account</h2>
            <p className="text-sm text-gray-600">Email: <span className="font-medium">{user?.email || '—'}</span></p>
            <div className="mt-3 space-x-3">
              <Link href="/change-password" className="text-blue-600">Change password</Link>
              <Link href="/logout" className="text-red-600">Sign out</Link>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded p-4 shadow">
          <h3 className="font-semibold mb-2">Profile</h3>
          <div className="text-sm text-gray-700">This account is a simple admin account used by the EMS demo. Your session token is stored securely in an http-only cookie (safer than localStorage).</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
