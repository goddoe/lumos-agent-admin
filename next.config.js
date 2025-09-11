/** @type {import('next').NextConfig} */
const nextConfig = {
  // appDir is now stable in Next.js 14, remove experimental flag
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude MongoDB from client-side bundles
      config.externals = config.externals || [];
      config.externals.push({
        'mongodb': 'mongodb',
        'mongodb-client-encryption': 'mongodb-client-encryption'
      });

      // Fallback for Node.js modules that MongoDB might require
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'net': false,
        'tls': false,
        'fs': false,
        'child_process': false,
        'worker_threads': false,
        'crypto': false,
        'stream': false,
        'http': false,
        'https': false,
        'url': false,
        'zlib': false,
        'querystring': false,
        'path': false,
        'os': false,
        'util': false
      };
    }

    return config;
  }
}

module.exports = nextConfig