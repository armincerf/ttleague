import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},

	async rewrites() {
		return [
			{
				source: "/bunseki.js",
				destination: "https://cloud.umami.is/script.js",
			},
		];
	},
};

export default nextConfig;
