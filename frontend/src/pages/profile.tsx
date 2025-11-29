import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setIsSaving(true);

    try {
      await updateProfile({
        email: email !== user?.email ? email : undefined,
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined
      });
      setStatus('Profile updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="card mb-6">
            <h1 className="text-2xl font-semibold mb-2">Profile</h1>
            <p className="text-gray-600 text-sm">Update your email or change password. Password changes require your current password.</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-5">
              {status && <div className="rounded bg-green-50 border border-green-200 text-green-700 px-4 py-2">{status}</div>}
              {error && <div className="rounded bg-red-50 border border-red-200 text-red-700 px-4 py-2">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={!user || isSaving}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Required only if changing password"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
