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
  }
};

module.exports = nextConfig;
