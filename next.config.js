/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Skip type checking during build - can be re-enabled later
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude test files and directories from the bundle
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'test/data': 'commonjs test/data',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
