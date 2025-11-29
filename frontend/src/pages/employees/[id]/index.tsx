import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useRouter } from 'next/router';
import { api, authHeader } from '../../../utils/api';
import { useEffect, useState } from 'react';

export default function EmployeeView() {
  const router = useRouter();
  const { id } = router.query;

  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await api.get(`/employees/${id}`, { headers: authHeader() });
        setEmployee(data);
      } catch (err: any) {
        if (err?.response?.status === 401) return router.replace('/login');
        setError(err?.message || 'Could not load employee');
      }
    })();
  }, [id]);

  const [error, setError] = useState<string | null>(null);

  if (!employee) return error ? <div className="p-6 text-red-600">{error}</div> : null;

  return (
    <ProtectedRoute>
      <Layout>
        <h2 className="text-xl font-semibold mb-4">{employee.name}</h2>
        <div className="card max-w-xl">
          <p><strong>Email:</strong> <span className="text-gray-700">{employee.email}</span></p>
          <p><strong>Phone:</strong> <span className="text-gray-700">{employee.phone}</span></p>
          <p><strong>Position:</strong> <span className="text-gray-700">{employee.position}</span></p>
          <p><strong>Salary:</strong> <span className="text-gray-700">{employee.salary}</span></p>
          <p><strong>Hire date:</strong> <span className="text-gray-700">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '—'}</span></p>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
