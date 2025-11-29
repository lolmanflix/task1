import { useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { api, authHeader } from '../utils/api';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submit(e: any) {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword }, { headers: authHeader() });
      setMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'Failed to change password');
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <div className="card w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Change password</h2>
          {message && <div className="text-sm mb-2 text-red-600">{message}</div>}
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm">Current password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm">New password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
            </div>

            <button className="w-full btn-primary" type="submit">Change password</button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
