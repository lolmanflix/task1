/** @type {import('next').NextConfig} */
const NEXT_PUBLIC_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  // During development proxy /api/* to the backend so requests are same-origin
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: NEXT_PUBLIC_API + '/:path*'
      }
    ];
  },
  // Export static site for Netlify deployment
  trailingSlash: true,
  exportPathMap: async function (defaultPathMap) {
    if (process.env.NETLIFY) {
      return {
        '/': { page: '/' },
        '/login': { page: '/login' },
        '/signup': { page: '/signup' },
        '/profile': { page: '/profile' },
        '/account': { page: '/account' },
        '/change-password': { page: '/change-password' },
        '/reset-password': { page: '/reset-password' },
        '/logout': { page: '/logout' },
        '/employees': { page: '/employees' },
        '/employees/add': { page: '/employees/add' },
        '/admins': { page: '/admins' },
        '/admins/add': { page: '/admins/add' },
      };
    }
    return defaultPathMap;
  }
};

module.exports = nextConfig;
