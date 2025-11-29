import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { api, authHeader } from '../../utils/api';
import { useEffect, useState } from 'react';

export default function Admins() {
  const [list, setList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await api.get('/admins', { headers: authHeader() });
    setList(data);
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.delete(`/admins/${id}`, { headers: authHeader() });
      setList((s) => s.filter((a) => a.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete admin');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">Admins</h2>
          <a href="/admins/add" className="btn-primary">Add admin</a>
        </div>

        {error && <div className="mb-4 text-red-600">{error}</div>}
        <div className="card">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 text-xs uppercase">
              <tr>
                <th>Email</th>
                <th>Created</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="py-3">{a.email}</td>
                  <td>{new Date(a.created_at).toLocaleString()}</td>
                  <td className="text-right pr-4">
                    <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:underline">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
