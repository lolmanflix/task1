import { useState } from 'react';
import { api } from '../utils/api';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setError(null);
    setIsSubmitting(true);

    try {
      await api.post('/auth/reset-password', { email });
      setStatus('If that email exists, a reset link has been sent via Supabase. Please check your inbox.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to request reset link');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Reset Admin Password</h2>
        <p className="text-sm text-gray-600 mb-4">Enter your account email. We will ask Supabase to send you a secure password reset link.</p>
        {status && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-4 py-2 mb-3 text-sm">{status}</div>}
        {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-4 py-2 mb-3 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              disabled={isSubmitting}
            />
          </div>

          <button className="w-full btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
}
