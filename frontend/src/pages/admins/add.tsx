import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { api, authHeader } from '../../utils/api';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AddAdmin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e: any) {
    e.preventDefault();
    try {
      await api.post('/admins', form, { headers: authHeader() });
      router.push('/admins');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed');
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <h2 className="text-lg font-semibold mb-4">Add Admin</h2>
        <div className="card max-w-lg">
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <form onSubmit={submit} className="space-y-3">
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded px-3 py-2" />
            <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded px-3 py-2" />
            <div className="flex justify-end">
              <button className="btn-primary" type="submit">Create</button>
            </div>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
