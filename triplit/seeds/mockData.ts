import type { BulkInsert } from "@triplit/client";
import { faker } from "@faker-js/faker";
import type { schema } from "../schema";

export default function seed(): BulkInsert<typeof schema> {
	// Generate users without league information
	const usersWithoutLeague = generateUsersWithoutLeague(100);

	// Generate league using these users
	const league = generateLeague(usersWithoutLeague);

	// Update users with league information
	const users = usersWithoutLeague.map((user) => ({
		...user,
		registered_league_ids: new Set([league.id]),
	}));

	const clubs = generateClubs(1, users);
	const events = generateEventsForLeague(league, clubs);
	const matches = generateMatchesForEvents(events, users);
	const games = generateGamesForMatches(matches, users);
	const eventRegistrations = generateEventRegistrations(events, users);

	return {
		users: [
			...users,
			{
				id: "1",
				email: "armincerf@gmail.com",
				first_name: "Alex",
				last_name: "Davis",
				gender: "male",
				table_tennis_england_id: "123456",
				current_division: "MKTTL - Division 5",
				rating: 69420,
				matches_played: 1000,
				wins: 694,
				losses: 420,
				no_shows: 0,
				created_at: faker.date.past(),
				updated_at: faker.date.recent(),
				updated_by: "alex",
			},
			{
				id: "user_2nkVcjC0FmzEjOPgDuu4t8kisEe",
				email: "alx@juxt.pro",
				first_name: "Alex",
				last_name: "Davis",
				table_tennis_england_id: "123457",
				current_division: "MKTTL - Division 5",
				rating: 620,
				matches_played: 1000,
				wins: 694,
				losses: 420,
				no_shows: 0,
				created_at: faker.date.past(),
				updated_at: faker.date.recent(),
				updated_by: "alex",
				registered_league_ids: new Set([league.id]),
			},
		],
		clubs,
		events,
		event_registrations: eventRegistrations,
		matches,
		games,
		leagues: [league],
	};
}

function generateUsersWithoutLeague(count: number) {
	return Array.from({ length: count }, (_, index) => {
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
			id: (index + 2).toString(), // Start from 2 to avoid conflict with the hardcoded user
			email: faker.internet.email(),
			profile_image_url: faker.image.avatar(),
			first_name: faker.person.firstName(),
			last_name: faker.person.lastName(),
			gender: faker.helpers.arrayElement(["male", "female"] as const),
			table_tennis_england_id: faker.number
				.int({
					min: 100000,
					max: 999999,
				})
				.toString(),
			current_division: faker.helpers.arrayElement([
				"MKTTL - Premier",
				"MKTTL - Division 1",
				"MKTTL - Division 2",
				"MKTTL - Division 3",
				"MKTTL - Division 4",
				"MKTTL - Division 5",
				"MKTTL - Division 6",
				"MKTTL - Division 7",
				"Not in a league",
			] as const),
			rating,
			matches_played,
			wins,
			losses,
			no_shows,
		};
	});
}

function generateLeague(users: ReturnType<typeof generateUsersWithoutLeague>) {
	return {
		id: "mk-ttl-singles",
		name: "Milton Keynes Singles League",
		description:
			"The official singles league for Milton Keynes table tennis players",
		logo_image_url: faker.image.url(),
		faq_html:
			"<h2>FAQ</h2><p>Frequently asked questions about the Milton Keynes Singles League...</p>",
		admins: new Set(
			faker.helpers.arrayElements(users, 3).map((user) => user.id),
		),
		club_ids: new Set(["mk-ttc"]),
		created_at: faker.date.past({ years: 2, refDate: new Date() }),
		updated_at: faker.date.recent(),
		updated_by: faker.helpers.arrayElement(users).id,
	};
}

function generateClubs(
	count: number,
	users: ReturnType<typeof generateUsersWithoutLeague>,
) {
	return [
		{
			id: "mk-ttc",
			name: "Milton Keynes Table Tennis Center",
			tables: faker.number.int({ min: 5, max: 15 }),
			admins: new Set(
				faker.helpers
					.arrayElements(users, { min: 2, max: 4 })
					.map((user) => user.id),
			),
			latitude: 52.03509999454491,
			longitude: -0.6864270729677547,
		},
		...Array.from({ length: count - 1 }, (_, index) => ({
			id: (index + 2).toString(),
			name: faker.company.name(),
			tables: faker.number.int({ min: 1, max: 10 }),
			admins: new Set(
				faker.helpers
					.arrayElements(users, { min: 1, max: 3 })
					.map((user) => user.id),
			),
			latitude: faker.location.latitude(),
			longitude: faker.location.longitude(),
		})),
	];
}

function generateEventsForLeague(
	league: ReturnType<typeof generateLeague>,
	clubs: ReturnType<typeof generateClubs>,
) {
	const now = new Date();
	const eventCount = 20;

	const todayEvent = {
		id: `${league.id}-mock-event-today`,
		name: `${now.toLocaleDateString("en-GB", {
			weekday: "long",
		})} Session - ${now.toLocaleDateString("en-GB", {
			day: "numeric",
			month: "long",
		})}`,
		description: "mock event happening today",
		start_time: new Date(now.setHours(19, 30, 0, 0)), // 7:30 PM today
		end_time: new Date(now.setHours(22, 0, 0, 0)), // 10:00 PM today
		club_id: faker.helpers.arrayElement(clubs).id,
		league_id: league.id,
		best_of: faker.helpers.arrayElement([5, 7]),
		tables: new Set([3, 4, 5, 6]),
		capacity: 12,
		status: "active" as const,
		created_at: faker.date.past({ years: 1, refDate: now }),
		updated_at: faker.date.recent(),
		updated_by: faker.helpers.arrayElement(clubs).admins.values().next().value,
	};

	const otherEvents = Array.from(
		{ length: eventCount - 1 },
		(_, eventIndex) => {
			const eventStart = faker.date.between({
				from: faker.date.past({ years: 1, refDate: now }),
				to: faker.date.future({ years: 1, refDate: now }),
			});
			const eventEnd = faker.date.soon({ days: 1, refDate: eventStart });

			let status: "draft" | "scheduled" | "active" | "completed" | "cancelled";
			if (eventStart > now) {
				status = faker.helpers.arrayElement(["draft", "scheduled"]);
			} else if (eventEnd < now) {
				status = "completed";
			} else {
				status = "active";
			}

			return {
				id: `${league.id}-event-${eventIndex + 1}`,
				name: `Event ${eventIndex + 1}`,
				description: faker.lorem.sentence(),
				start_time: eventStart,
				end_time: eventEnd,
				club_id: faker.helpers.arrayElement(clubs).id,
				league_id: league.id,
				best_of: faker.helpers.arrayElement([5, 7]),
				tables: new Set(
					faker.helpers.arrayElements([1, 2, 3, 4, 5], { min: 1, max: 5 }),
				),
				capacity: faker.helpers.maybe(() =>
					faker.number.int({ min: 10, max: 50 }),
				),
				status,
				created_at: faker.date.past({ years: 1, refDate: eventStart }),
				updated_at: faker.date.recent(),
				updated_by: faker.helpers.arrayElement(clubs).admins.values().next()
					.value,
			};
		},
	);

	return [todayEvent, ...otherEvents];
}

function generateMatchesForEvents(
	events: ReturnType<typeof generateEventsForLeague>,
	users: ReturnType<typeof generateUsersWithoutLeague>,
) {
	return events.flatMap((event, eventIndex) => {
		const matchCount = event.status === "completed" ? 20 : 10;
		return Array.from({ length: matchCount }, (_, matchIndex) => {
			const [player1, player2] = faker.helpers.arrayElements(users, 2);
			return {
				id: `${event.id}-match-${matchIndex + 1}`,
				player_1: player1.id,
				player_2: player2.id,
				umpire:
					faker.helpers.maybe(() => faker.helpers.arrayElement(users).id) ??
					undefined,
				manually_created: faker.datatype.boolean(),
				event_id: event.id,
				table_number: faker.number.int({ min: 1, max: 10 }),
				created_at: faker.date.past(),
				updated_at: faker.date.recent(),
				updated_by: faker.helpers.arrayElement(users).id,
				edited_at: faker.date.recent(),
				status:
					event.status === "completed"
						? "confirmed"
						: faker.helpers.arrayElement(["pending", "confirmed"] as const),
				ranking_score_delta: faker.number.int({ min: -100, max: 100 }),
				winner:
					event.status === "completed"
						? faker.helpers.arrayElement([player1.id, player2.id])
						: undefined,
			};
		});
	});
}

function generateGamesForMatches(
	matches: ReturnType<typeof generateMatchesForEvents>,
	users: ReturnType<typeof generateUsersWithoutLeague>,
) {
	return matches.flatMap((match) => {
		const gameCount = match.status === "confirmed" ? 4 : 0;
		const matchCreatedAt = new Date(match.created_at);
		const matchUpdatedAt = new Date(match.updated_at);

		return Array.from({ length: gameCount }, (_, gameIndex) => {
			const startedAt = faker.date.between({
				from: matchCreatedAt,
				to: matchUpdatedAt,
			});
			const completedAt =
				faker.helpers.maybe(() =>
					faker.date.soon({
						days: 0.1,
						refDate: startedAt,
					}),
				) ?? undefined;
			const player2Score =
				gameIndex === 3 ? 11 : faker.number.int({ min: 0, max: 9 });
			const player1Score =
				gameIndex === 3 ? faker.number.int({ min: 0, max: 9 }) : 11;

			const final = {
				id: `${match.id}-game-${gameIndex + 1}`,
				match_id: match.id,
				player_1_score: player1Score,
				player_2_score: player2Score,
				started_at: startedAt,
				final_score: completedAt
					? `${player1Score} - ${player2Score}`
					: undefined,
				last_edited_at: new Date(),
				game_number: gameIndex + 1,
				updated_by: faker.helpers.arrayElement(users).id,
			};
			if (completedAt) {
				Object.assign(final, {
					completed_at: completedAt,
				});
			}
			return final;
		});
	});
}

function generateEventRegistrations(
	events: ReturnType<typeof generateEventsForLeague>,
	users: ReturnType<typeof generateUsersWithoutLeague>,
) {
	return events.flatMap((event) => {
		let registrationCount: number;
		let eligibleUsers: typeof users;

		if (event.id === `${event.league_id}-event-today`) {
			registrationCount = 12;
			eligibleUsers = users.filter(
				(user) => user.id !== "user_2nkVcjC0FmzEjOPgDuu4t8kisEe",
			);
		} else {
			registrationCount = faker.number.int({ min: 5, max: 20 });
			eligibleUsers = users;
		}

		return Array.from({ length: registrationCount }, (_, regIndex) => ({
			id: `${event.id}-registration-${regIndex + 1}`,
			user_id: faker.helpers.arrayElement(eligibleUsers).id,
			event_id: event.id,
			league_id: event.league_id,
			created_at: faker.date.past(),
			updated_at: faker.date.recent(),
			updated_by: faker.helpers.arrayElement(users).id,
			minimum_opponent_level: faker.helpers.arrayElement(["A", "B", "C", "D"]),
			max_opponent_level: faker.helpers.arrayElement(["A", "B", "C", "D"]),
			confidence_level: faker.number.int({ min: 1, max: 100 }),
		}));
	});
}
