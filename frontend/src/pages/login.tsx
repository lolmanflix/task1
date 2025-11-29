import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Set default values in development on component mount
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !email && !password) {
      setEmail('admin@example.com');
      setPassword('password123');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      // Redirect to the requested page or default to '/employees'
      const redirectTo = router.query.redirect as string || '/employees';
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-1 w-full border rounded px-3 py-2"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-1 w-full border rounded px-3 py-2"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            className="w-full btn-primary" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-3 flex justify-between text-sm text-gray-600">
          <a href="/reset-password" className="text-blue-600">Forgot / Reset password</a>
          <a href="/signup" className="text-blue-600">Sign up</a>
        </div>
      </div>
    </div>
  );
}
