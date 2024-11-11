import type { NextConfig } from "next";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

if (process.env.NODE_ENV === "development") {
	setupDevPlatform();
}

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
			{
				source: "/qr",
				destination: "/sign-up?utm_source=qr",
				permanent: false,
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
} satisfies NextConfig;
