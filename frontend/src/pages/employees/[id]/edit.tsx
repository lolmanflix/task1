import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { api, authHeader } from '../../../utils/api';

export default function EditEmployee() {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState<any>({ name: '', email: '', phone: '', position: '', salary: '', hire_date: '' });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await api.get(`/employees/${id}`, { headers: authHeader() });
        setForm({ ...data, salary: data.salary ?? '', hire_date: data.hire_date ? data.hire_date.split('T')[0] : '' });
      } catch (err: any) {
        if (err?.response?.status === 401) return router.replace('/login');
        setError(err?.message || 'Could not load employee');
      }
    })();
  }, [id]);

  const [error, setError] = useState<string | null>(null);

  async function submit(e: any) {
    e.preventDefault();
    try {
      await api.put(`/employees/${id}`, { ...form, salary: form.salary ? Number(form.salary) : undefined }, { headers: authHeader() });
      router.push('/employees');
    } catch (err: any) {
      if (err?.response?.status === 401) return router.replace('/login');
      setError(err?.message || 'Failed to save');
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <h2 className="text-lg font-semibold mb-4">Edit Employee</h2>
        <div className="card max-w-lg">
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <form onSubmit={submit} className="space-y-3">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded px-3 py-2" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded px-3 py-2" />
            <input placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full border rounded px-3 py-2" />
            <input placeholder="Salary" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="w-full border rounded px-3 py-2" />
            <input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} className="w-full border rounded px-3 py-2" />

            <div className="flex justify-end">
              <button className="btn-primary" type="submit">Save</button>
            </div>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
