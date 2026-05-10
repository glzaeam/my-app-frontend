/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://nexum.runasp.net/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 
