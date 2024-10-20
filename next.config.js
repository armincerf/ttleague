/** @type {import('next').NextConfig} */
const nextConfig = {
	// ... other configurations ...

	async rewrites() {
		return [
			{
				source: "/bunseki.js",
				destination: "https://cloud.umami.is/script.js",
			},
		];
	},
};

module.exports = nextConfig;
