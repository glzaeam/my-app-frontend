/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5026/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 
