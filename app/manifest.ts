import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "TT Rankings",
		short_name: "TT Rankings",
		description:
			"Find local Table Tennis players, play matches, and track your progress",
		start_url: "/leaderboard",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#ffffff",
		icons: [
			{
				purpose: "any",
				sizes: "512x512",
				src: "/icon.png",
				type: "image/png",
			},
		],
	};
}
