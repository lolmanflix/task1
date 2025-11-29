import { useState } from 'react';
import { api } from '../utils/api';
import { useRouter } from 'next/router';

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(e: any) {
    e.preventDefault();
    setError('');
    try {
      // call backend signup which will set httpOnly cookie on success
      const { data } = await api.post('/auth/signup', form);
      router.push('/employees');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to sign up');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Sign up (Admin)</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm">Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          <button className="w-full btn-primary" type="submit">Sign up</button>
        </form>
      </div>
    </div>
  );
}
