/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.100.24', 'localhost'],

  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'chart.js',
      'react-hot-toast',
      '@tanstack/react-query',
    ],
    clientRouterFilter: true,
    clientRouterFilterRedirects: false,
    optimizeCss: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },

  compress: true,

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  productionBrowserSourceMaps: false,

  outputFileTracingIncludes: {
    '/api/admin/backup/create': [
      'node_modules/jszip/**/*',
      'node_modules/@prisma/client/**/*',
    ],
    '/api/admin/backup/cron': [
      'node_modules/jszip/**/*',
      'node_modules/@prisma/client/**/*',
    ],
    '/api/admin/backup/queue': [
      'node_modules/jszip/**/*',
      'node_modules/@prisma/client/**/*',
    ],
  },

  outputFileTracingExcludes: {
    '/api/admin/backup/create': [
      '**/backup.worker.ts',
      '**/backups/**',
    ],
    '/api/admin/backup/cron': [
      '**/backup.worker.ts',
      '**/backups/**',
    ],
    '/api/admin/backup/queue': [
      '**/backup.worker.ts',
      '**/backups/**',
    ],
  },

  // ✅ FIX: Rewrite double /api/api/ paths to single /api/
  // This handles the case where proxy.ts middleware double-encodes the path
  async rewrites() {
    return [
      {
        source: '/api/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },

  // ✅ Add turbopack config (empty for now)
  turbopack: {},

  // ✅ Only apply webpack config when using webpack
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Only apply when using webpack
    if (isServer && process.env.NEXT_WEBPACK) {
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      
      config.module.rules.push({
        test: /backup\.worker\.ts$/,
        use: 'ignore-loader',
      });
    }
    return config;
  },

  serverExternalPackages: ['jszip', 'crypto', '@vercel/blob'],
  poweredByHeader: false,
}

module.exports = nextConfig
