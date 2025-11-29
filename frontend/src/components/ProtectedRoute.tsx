import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user is logged in, redirect to login
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
    }
    
    // If user is logged in but not an admin and admin is required, redirect to home
    if (!loading && user && requireAdmin && !user.isAdmin) {
      router.push('/');
    }
  }, [user, loading, router, requireAdmin]);

  // Show loading state while checking auth status
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If admin access is required but user is not an admin
  if (requireAdmin && !user.isAdmin) {
    return null; // Will be redirected by the useEffect
  }

  return <>{children}</>;
}
