import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { api, authHeader } from '../../utils/api';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Employees() {
  const [list, setList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  // pending deletions: employee removed from list but not yet sent to server.
  const [pending, setPending] = useState<{ id: string; employee: any; timeoutId: number }[]>([]);
  const mountedRef = useRef(true);

  const router = useRouter();

  async function load() {
    try {
      const { data } = await api.get('/employees', { headers: authHeader() });
      setList(data);
      setError(null);
    } catch (err: any) {
      // axios network errors don't have response, treat accordingly
      if (err?.response?.status === 401) {
        // not authenticated — send to login
        router.replace('/login');
        return;
      }
      setError(err?.message || 'Network error while loading employees');
      setList([]);
    }
  }

  const DELETE_DELAY = 7000; // milliseconds - allow undo

  function flushPendingTimeouts() {
    // clear in-memory timeouts (useful on unmount)
    pending.forEach((p) => window.clearTimeout(p.timeoutId));
  }

  async function finalizeDelete(id: string) {
    try {
      await api.delete(`/employees/${id}`);
      // if server-side deletion fails, add back the employee
    } catch (err: any) {
      const p = pending.find((x) => x.id === id);
      if (p) {
        setList((s) => [p.employee, ...s]);
        setError(err?.response?.data?.error || 'Failed to delete employee on server');
      }
    } finally {
      setPending((s) => s.filter((x) => x.id !== id));
    }
  }

  function handleDelete(id: string) {
    const ok = confirm('Delete this employee? You can undo for a few seconds.');
    if (!ok) return;

    const emp = list.find((x) => x.id === id);
    if (!emp) return;

    // Optimistic UI: remove immediately
    setList((s) => s.filter((x) => x.id !== id));

    // Start timer before sending deletion to server, allowing undo.
    const timeoutId = window.setTimeout(() => {
      finalizeDelete(id);
    }, DELETE_DELAY) as unknown as number;

    setPending((s) => [...s, { id, employee: emp, timeoutId }]);
  }

  function handleUndo(id: string) {
    const found = pending.find((p) => p.id === id);
    if (!found) return;
    window.clearTimeout(found.timeoutId);
    setPending((s) => s.filter((p) => p.id !== id));
    setList((s) => [found.employee, ...s]);
  }

  useEffect(() => { load(); return () => {
    mountedRef.current = false;
    flushPendingTimeouts();
  }; }, []);

  return (
    <ProtectedRoute>
      <Layout>
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700 flex justify-between items-center">
            <div>{error}</div>
            <button onClick={() => load()} className="ml-4 bg-white border rounded px-3 py-1 text-sm">Retry</button>
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">Employees</h2>
          <Link href="/employees/add" className="btn-primary">Add employee</Link>
        </div>

        <div className="card w-full p-6">
          <table className="w-full text-base min-w-full">
            <thead className="text-left text-gray-500 text-sm uppercase tracking-wide">
              <tr>
                <th className="w-3/5">Name</th>
                <th className="w-1/5">Position</th>
                <th className="w-1/6">Salary</th>
                <th className="text-right pr-6 w-1/6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && !error && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">No employees yet</td>
                </tr>
              )}
              {list.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="py-4 flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-base">{e.name?.charAt(0)?.toUpperCase()}</div>
                    <div>
                      <div className="font-medium text-gray-900 text-lg">{e.name}</div>
                      <div className="text-sm text-gray-500">{e.email}</div>
                    </div>
                  </td>
                  <td className="text-base text-gray-700">{e.position}</td>
                  <td className="text-base text-gray-700">{e.salary}</td>
                  <td className="space-x-3 text-right">
                    <Link href={`/employees/${e.id}`} className="text-blue-600 hover:underline">View</Link>
                    <Link href={`/employees/${e.id}/edit`} className="text-orange-600 hover:underline">Edit</Link>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="ml-2 text-red-600 hover:text-red-700 p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-200"
                      title="Delete employee"
                      aria-label={`Delete ${e.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* pending undo snackbars */}
        <div aria-live="polite" className="fixed bottom-6 right-6 z-50 space-y-3">
          {pending.map((p) => (
            <div key={p.id} className="flex items-center space-x-3 rounded bg-gray-900 text-white px-4 py-3 shadow-lg">
              <div className="flex-1 text-sm">Removed <strong>{p.employee.name}</strong></div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleUndo(p.id)} className="px-3 py-1 border rounded bg-white text-sm text-gray-900">Undo</button>
              </div>
            </div>
          ))}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
