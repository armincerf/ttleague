import { z } from "zod";
import type { Player } from "./types";

export const STORAGE_KEY = "scoreboardSettings";

export const storedSettingsSchema = z.object({
	bestOf: z.number().optional(),
	pointsToWin: z.number().optional(),
	playerOneStarts: z.boolean().optional(),
	sidesSwapped: z.boolean().optional(),
	player1Name: z.string().optional(),
	player2Name: z.string().optional(),
});

export type StoredSettings = z.infer<typeof storedSettingsSchema>;

export function getStoredSettings(): Partial<StoredSettings> {
	if (typeof window === "undefined") return {};
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return {};
	try {
		const parsed = storedSettingsSchema.safeParse(JSON.parse(stored));
		return parsed.success ? parsed.data : {};
	} catch {
		return {};
	}
}

export function saveSettings(
	settings: Partial<StoredSettings>,
	player1: Player,
	player2: Player,
) {
	localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify({
			...settings,
			player1Name: `${player1.firstName} ${player1.lastName}`.trim(),
			player2Name: `${player2.firstName} ${player2.lastName}`.trim(),
		}),
	);
}
