// Path: C:\Users\Administrator\Desktop\BDD\nextjs-mongodb-crud\next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@chakra-ui/react',
    '@chakra-ui/next-js',
    '@chakra-ui/system'
  ],
  experimental: {
    esmExternals: 'loose',
  },
  // Add CORS headers for API routes
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // In production, specify your domain instead of *
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
  // Ensure cookies are properly handled
  serverRuntimeConfig: {
    // Will only be available on the server side
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    },
  },
  // Disable image optimization if not needed
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.plugins = config.plugins.filter(
      (plugin) => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
    );
    return config;
  },
};

module.exports = nextConfig;