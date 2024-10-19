import type { BulkInsert } from "@triplit/client";
import { faker } from "@faker-js/faker";
import type { schema } from "../schema";

export default function seed(): BulkInsert<typeof schema> {
	const users = generateUsers(100);
	const clubs = generateClubs(10, users);
	const events = generateEvents(100, clubs);
	const eventRegistrations = generateEventRegistrations(200, users, events);
	const matches = generateMatches(300, users, events);
	const games = generateGames(600, matches, users);

	return {
		users,
		clubs,
		events,
		event_registrations: eventRegistrations,
		matches,
		games,
	};
}

function generateUsers(count: number) {
	return Array.from({ length: count }, () => {
		const matches_played = faker.number.int({ min: 10, max: 100 });
		const wins = faker.number.int({ min: 0, max: matches_played });
		const losses = matches_played - wins;
		const no_shows = faker.number.int({
			min: 0,
			max: Math.min(10, matches_played),
		});

		const winPercentage = wins / matches_played;
		const baseRating = 1500;
		const ratingAdjustment = Math.round((winPercentage - 0.5) * 1000);
		const rating = Math.max(
			1000,
			Math.min(2000, baseRating + ratingAdjustment),
		);

		return {
			id: faker.string.uuid(),
			email: faker.internet.email(),
			profile_image_url: faker.image.avatar(),
			first_name: faker.person.firstName(),
			last_name: faker.person.lastName(),
			gender: faker.helpers.arrayElement(["male", "female"] as const),
			current_division: faker.helpers.arrayElement([
				"A",
				"B",
				"C",
				"D",
			] as const),
			rating,
			matches_played,
			wins,
			losses,
			no_shows,
		};
	});
}

function generateClubs(count: number, users: ReturnType<typeof generateUsers>) {
	return Array.from({ length: count }, () => ({
		id: faker.string.uuid(),
		name: faker.company.name(),
		tables: faker.number.int({ min: 1, max: 10 }),
		admins: new Set(
			faker.helpers
				.arrayElements(users, { min: 1, max: 3 })
				.map((user) => user.id),
		),
		latitude: faker.location.latitude(),
		longitude: faker.location.longitude(),
	}));
}

function generateEvents(
	count: number,
	clubs: ReturnType<typeof generateClubs>,
) {
	return Array.from({ length: count }, () => ({
		id: faker.string.uuid(),
		name: faker.lorem.words({ min: 2, max: 5 }),
		description: faker.lorem.sentence(),
		start_time: faker.date.future(),
		club_id: faker.helpers.arrayElement(clubs).id,
		best_of: faker.helpers.arrayElement([3, 5, 7]),
		tables: new Set(
			faker.helpers.arrayElements([1, 2, 3, 4, 5], { min: 1, max: 5 }),
		),
		status: faker.helpers.arrayElement([
			"draft",
			"scheduled",
			"active",
			"completed",
			"cancelled",
		] as const),
	}));
}

function generateEventRegistrations(
	count: number,
	users: ReturnType<typeof generateUsers>,
	events: ReturnType<typeof generateEvents>,
) {
	return Array.from({ length: count }, () => ({
		id: faker.string.uuid(),
		user_id: faker.helpers.arrayElement(users).id,
		event_id: faker.helpers.arrayElement(events).id,
		created_at: faker.date.past(),
		minimum_opponent_level: faker.helpers.arrayElement(["A", "B", "C", "D"]),
	}));
}

function generateMatches(
	count: number,
	users: ReturnType<typeof generateUsers>,
	events: ReturnType<typeof generateEvents>,
) {
	return Array.from({ length: count }, () => {
		const [player1, player2] = faker.helpers.arrayElements(users, 2);
		const event = faker.helpers.arrayElement(events);
		return {
			id: faker.string.uuid(),
			player_1: player1.id,
			player_2: player2.id,
			umpire: faker.helpers.maybe(() => faker.helpers.arrayElement(users).id),
			manually_created: faker.datatype.boolean(),
			event_id: event.id,
			table_number: faker.number.int({ min: 1, max: 10 }),
			created_at: faker.date.past(),
			edited_at: faker.date.recent(),
			status: faker.helpers.arrayElement([
				"pending",
				"confirmed",
				"cancelled",
			] as const),
			ranking_score_delta: faker.number.int({ min: -100, max: 100 }),
			winner: faker.helpers.maybe(() =>
				faker.helpers.arrayElement([player1.id, player2.id]),
			),
		};
	});
}

function generateGames(
	count: number,
	matches: ReturnType<typeof generateMatches>,
	users: ReturnType<typeof generateUsers>,
) {
	return Array.from({ length: count }, () => {
		const match = faker.helpers.arrayElement(matches);
		return {
			id: faker.string.uuid(),
			match_id: match.id,
			player_1_score: faker.number.int({ min: 0, max: 11 }),
			player_2_score: faker.number.int({ min: 0, max: 11 }),
			started_at: faker.date.past(),
			first_completed_at: faker.date.past(),
			last_edited_at: faker.date.recent(),
			edited_by: faker.helpers.arrayElement(users).id,
			game_number: faker.number.int({ min: 1, max: 5 }),
		};
	});
}
