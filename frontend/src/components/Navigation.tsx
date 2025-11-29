import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

const baseLinks = [
  { href: '/employees', label: 'Employees', requireAdmin: false },
  { href: '/admins', label: 'Admins', requireAdmin: true },
  { href: '/profile', label: 'Profile', requireAdmin: false }
];

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const links = useMemo(() => baseLinks.filter((link) => user ? (!link.requireAdmin || user.isAdmin) : !link.requireAdmin), [user]);

  return (
    <header className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/employees" className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold">
            E
          </div>
          <div className="hidden sm:block">
            <div className="font-semibold text-gray-900">EMS Admin</div>
            <div className="text-xs text-gray-500">Employee Management</div>
          </div>
        </Link>

        <nav className="flex items-center space-x-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg transition ${router.pathname.startsWith(link.href) ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <span className="hidden sm:inline text-gray-500">{user.email}</span>
              <button onClick={logout} className="text-red-600 hover:text-red-700 px-3 py-2 rounded-lg">Logout</button>
            </>
          ) : (
            <Link href="/login" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
