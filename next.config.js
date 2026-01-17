/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for Docker optimization
  output: 'standalone',
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
  
  // =====================================================
  // SEGURIDAD: Headers de seguridad mejorados
  // =====================================================
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
          {
            // Política de seguridad de contenido
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
          },
          {
            // Prevenir que el navegador infiera el MIME type
            key: 'X-Download-Options',
            value: 'noopen',
          },
          {
            // Protección adicional contra clickjacking
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          {
            // Forzar HTTPS (ajusta max-age según necesites)
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      {
        // Headers específicos para rutas API - protección adicional
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
