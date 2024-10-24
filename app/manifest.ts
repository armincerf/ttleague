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
				purpose: "maskable",
				sizes: "512x512",
				src: "icon512_maskable.png",
				type: "image/png",
			},
			{
				purpose: "any",
				sizes: "512x512",
				src: "icon512_rounded.png",
				type: "image/png",
			},
		],
	};
}
