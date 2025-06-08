/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'maps.googleapis.com',
      'places.googleapis.com',
      'lh3.googleusercontent.com',
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig 