/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: 'ecoswap-colombia',
  },
}

module.exports = nextConfig
