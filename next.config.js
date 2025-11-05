/** @type {import('next').NextConfig} */
const nextConfig = {
  // Generate unique build IDs to ensure cache invalidation
  generateBuildId: () => {
    return 'build-' + Date.now();
  },
  // Using serverful runtime to support API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['localhost']
  },
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Add trailing slash for better SEO
  trailingSlash: false,
  // Configure headers for better security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
