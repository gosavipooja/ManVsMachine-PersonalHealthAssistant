const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    WEAVIATE_URL: process.env.WEAVIATE_URL || 'http://localhost:8080',
    WEAVIATE_API_KEY: process.env.WEAVIATE_API_KEY,
  }
};

module.exports = withPWA(nextConfig);
