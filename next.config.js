/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, _options) => {
    config.module.rules.push({ test: /\.sql$/, loader: "raw-loader" });
    return config;
  },
};

module.exports = nextConfig;
