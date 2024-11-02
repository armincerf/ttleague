import { createMatchConfirmation } from "../utils/matchConfirmationUtils";
import {
	createTestClient,
	setupTournamentTest,
	createMockMatch,
} from "./triplitTestUtils";
import { describe, it, expect, beforeEach } from "vitest";

describe("matchConfirmationUtils", () => {
	const testClient = createTestClient();
	const matchConfirmation = createMatchConfirmation(testClient);
	beforeEach(async () => {
		await testClient.reset();
	});

	describe("confirmInitialMatch", () => {
		it("should add player to confirmed list", async () => {
			const { player1 } = await setupTournamentTest(testClient);
			const match = await createMockMatch(testClient, {
				player_1: player1.id,
			});

			await matchConfirmation.confirmInitialMatch(match.id, player1.id);

			const updatedMatch = await testClient.fetchById("matches", match.id);
			expect(updatedMatch?.playersConfirmed.has(player1.id)).toBe(true);
		});
	});

	describe("confirmInitialMatchUmpire", () => {
		it("should update match status and umpire confirmation", async () => {
			const { umpire } = await setupTournamentTest(testClient);
			const match = await createMockMatch(testClient, {
				umpire: umpire.id,
			});

			await matchConfirmation.confirmInitialMatchUmpire(match.id, umpire.id);

			const updatedMatch = await testClient.fetchById("matches", match.id);
			expect(updatedMatch?.status).toBe("ongoing");
			expect(updatedMatch?.umpireConfirmed).toBe(true);
			expect(updatedMatch?.updated_by).toBe(umpire.id);
		});
	});
});
