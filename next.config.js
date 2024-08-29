// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
    ],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if(!isServer) return config
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      oneOf: [
        {
          resourceQuery: /raw/,
          use: 'raw-loader',
        },
      ],
    });

    return config;
  },
  experimental: {
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
};

module.exports = nextConfig;
