/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest.json$/],
});

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

module.exports = withPWA(nextConfig);
