import { TriplitClient } from "@triplit/client";
import { schema } from "@/triplit/schema";
import type { Match, User, ActiveTournament } from "@/triplit/schema";

export function createTestClient() {
	return new TriplitClient({ schema });
}

export async function createMockEvent(client: TriplitClient<typeof schema>) {
	const eventId = "test-event";
	await client.insert("events", {
		id: eventId,
		name: "Test Event",
		start_time: new Date(),
		end_time: new Date(),
		club_id: "test-club",
		league_id: "test-league",
		status: "active",
	});
	return eventId;
}

export async function createMockTournament(
	client: TriplitClient<typeof schema>,
	eventId: string,
): Promise<ActiveTournament> {
	const tournament = {
		id: "test-tournament",
		event_id: eventId,
		status: "idle",
		player_ids: new Set<string>(),
		created_at: new Date(),
		updated_at: new Date(),
	} satisfies ActiveTournament;

	await client.insert("active_tournaments", tournament);
	return tournament;
}

export async function createMockPlayer(
	client: TriplitClient<typeof schema>,
	options: Partial<User> = {},
): Promise<User> {
	const playerId = options.id ?? "test-player";

	const player = {
		id: playerId,
		first_name: "Test",
		last_name: "Player",
		email: `${playerId}@test.com`,
		rating: 1500,
		matches_played: 0,
		wins: 0,
		losses: 0,
		no_shows: 0,
		current_tournament_priority: 0,
		registered_league_ids: new Set<string>(),
		created_at: new Date(),
		updated_at: new Date(),
		...options,
	} satisfies User;

	await client.insert("users", player);
	return player;
}

export async function createMockMatch(
	client: TriplitClient<typeof schema>,
	options: Partial<Match> = {},
): Promise<Match> {
	const matchId = options.id ?? "test-match";

	const match = {
		id: matchId,
		player_1: "player-1",
		player_2: "player-2",
		umpire: "umpire-1",
		event_id: "test-event",
		table_number: 1,
		status: "pending",
		manually_created: false,
		ranking_score_delta: 0,
		playersConfirmed: new Set<string>(),
		umpireConfirmed: false,
		best_of: 3,
		created_at: new Date(),
		updated_at: new Date(),
		edited_at: new Date(),
		startTime: new Date(),
		...options,
	} satisfies Match;

	await client.insert("matches", match);
	return match;
}

export async function setupTournamentTest(
	client: TriplitClient<typeof schema>,
) {
	const eventId = await createMockEvent(client);
	const tournament = await createMockTournament(client, eventId);
	const player1 = await createMockPlayer(client, { id: "player-1" });
	const player2 = await createMockPlayer(client, { id: "player-2" });
	const umpire = await createMockPlayer(client, { id: "umpire-1" });

	await client.update("active_tournaments", tournament.id, (t) => {
		t.player_ids.add(player1.id);
		t.player_ids.add(player2.id);
		t.player_ids.add(umpire.id);
	});

	return {
		tournament,
		eventId,
		player1,
		player2,
		umpire,
	};
}
