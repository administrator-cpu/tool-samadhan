import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
        remotePatterns : [
            {
                protocol: 'https',
                hostname: 'scontent.cdninstagram.com',
            },
            {
                protocol: 'https',
                hostname: '*.cdninstagram.com',
            },
            {
                protocol: 'https',
                hostname: 'instagram.fdel1-1.fna.fbcdn.net',
            },
            {
                protocol: 'https',
                hostname: '*.fbcdn.net',
            },
        {
          protocol: 'https',
          hostname: 'lh3.googleusercontent.com',
        },
        {
            protocol: 'https',
            hostname: 'images.unsplash.com',
        },
        ]
    },

    reactStrictMode: false,
  compiler: {
      removeConsole: true,
  },
};

export default nextConfig;
