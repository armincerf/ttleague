import type { NextConfig } from "next";

export default {
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
	async redirects() {
		return [
			{
				source: "/",
				destination: "/leaderboard",
				permanent: true,
			},
		];
	},
	async rewrites() {
		return [
			{
				source: "/bunseki.js",
				destination: "https://cloud.umami.is/script.js",
			},
			{
				source: "/php/ajax.php",
				destination: "https://pingpongmap.net/php/ajax.php",
			},
			{
				source: "/upload/:path*",
				destination: "https://pingpongmap.net/upload/:path*",
			},
		];
	},
};
