import {
	type ClientSchema,
	type Entity,
	type Roles,
	Schema as S,
} from "@triplit/client";

export const roles: Roles = {
	admin: {
		match: {
			type: "admin",
			sub: "$userId",
		},
	},
	user: {
		match: {
			sub: "$userId",
		},
	},
	anonymous: {
		match: {
			"x-triplit-token-type": "anon",
		},
	},
};

const adminFullAccess = {
	read: { filter: [true] },
	insert: { filter: [true] },
	update: { filter: [true] },
	delete: { filter: [true] },
};

const userReadOnly = {
	read: { filter: [true] },
};

const defaultPermissions = {
	admin: adminFullAccess,
	user: userReadOnly,
	anonymous: {
		read: { filter: [true] },
	},
};

export const schema = {
	users: {
		schema: S.Schema({
			id: S.Id(),
			table_tennis_england_id: S.String(),
			email: S.String(),
			profile_image_url: S.Optional(S.String()),
			first_name: S.String(),
			last_name: S.String(),
			gender: S.Optional(S.String({ enum: ["male", "female"] as const })),
			current_division: S.Optional(S.String()),
			default_min_opponent_level: S.Optional(S.String()),
			default_max_opponent_level: S.Optional(S.String()),
			rating: S.Number(),
			matches_played: S.Number(),
			wins: S.Number(),
			losses: S.Number(),
			no_shows: S.Number(),
			registered_league_ids: S.Set(S.Id()),
			leagues: S.RelationMany("leagues", {
				where: [["id", "in", "$registered_league_ids"]],
			}),
			events: S.RelationMany("event_registrations", {
				where: [["$user_id", "=", "$id"]],
			}),
			matches: S.RelationMany("matches", {
				where: [
					["$player_1", "=", "$id"],
					["$player_2", "=", "$id"],
				],
			}),
			created_at: S.Date({ default: S.Default.now() }),
			updated_at: S.Date({ default: S.Default.now() }),
			updated_by: S.Optional(S.Id()),
		}),
		permissions: {
			admin: adminFullAccess,
			user: {
				...userReadOnly,
				insert: {
					filter: [["id", "=", "$role.userId"]],
				},
				update: { filter: [["id", "=", "$role.userId"]] },
				delete: { filter: [["id", "=", "$role.userId"]] },
			},
			anonymous: {
				read: { filter: [true] },
			},
		},
	},
	clubs: {
		schema: S.Schema({
			id: S.Id(),
			name: S.String(),
			tables: S.Number(),
			admins: S.Set(S.Id()),
			latitude: S.Number(),
			longitude: S.Number(),
			events: S.RelationMany("events", {
				where: [["$club_id", "=", "$id"]],
			}),
			created_at: S.Date({ default: S.Default.now() }),
			updated_at: S.Date({ default: S.Default.now() }),
			updated_by: S.Optional(S.Id()),
		}),
		permissions: defaultPermissions,
	},
	events: {
		schema: S.Schema({
			id: S.Id(),
			name: S.String(),
			description: S.Optional(S.String()),
			start_time: S.Date(),
			end_time: S.Date(),
			created_at: S.Date({ default: S.Default.now() }),
			updated_at: S.Date({ default: S.Default.now() }),
			updated_by: S.Optional(S.Id()),
			club_id: S.Id(),
			club: S.RelationById("clubs", "$club_id"),
			league_id: S.Id(),
			season_id: S.Optional(S.Id()),
			best_of: S.Number(),
			tables: S.Set(S.Number()),
			capacity: S.Optional(S.Number()),
			status: S.String({
				enum: [
					"draft",
					"scheduled",
					"active",
					"completed",
					"cancelled",
				] as const,
			}),
			registrations: S.RelationMany("event_registrations", {
				where: [["event_id", "=", "$id"]],
			}),
			matches: S.RelationMany("matches", {
				where: [["event_id", "=", "$id"]],
			}),
		}),
		permissions: defaultPermissions,
	},
	event_registrations: {
		schema: S.Schema({
			id: S.Id(),
			user_id: S.Id(),
			event_id: S.Id(),
			league_id: S.Id(),
			created_at: S.Date({ default: S.Default.now() }),
			updated_at: S.Date({ default: S.Default.now() }),
			updated_by: S.Optional(S.Id()),
			minimum_opponent_level: S.Optional(S.String()),
			max_opponent_level: S.Optional(S.String()),
			confidence_level: S.Number(),
			user: S.RelationById("users", "$user_id"),
			event: S.RelationById("events", "$event_id"),
		}),
		permissions: {
			admin: adminFullAccess,
			user: {
				read: { filter: [true] },
				insert: {
					filter: [["user_id", "=", "$role.userId"]],
				},
				delete: {
					filter: [["user_id", "=", "$role.userId"]],
				},
			},
			anonymous: {
				read: { filter: [true] },
			},
		},
	},
	// matches are generated one hour or so before the start date
	matches: {
		schema: S.Schema({
			id: S.Id(),
			player_1: S.Id(),
			player_2: S.Id(),
			umpire: S.Optional(S.Id()),
			manually_created: S.Boolean(),
			event_id: S.Id(),
			table_number: S.Number(),
			created_at: S.Date({ default: S.Default.now() }),
			updated_at: S.Date({ default: S.Default.now() }),
			updated_by: S.Optional(S.Id()),
			edited_at: S.Date(),
			status: S.String({
				enum: ["pending", "confirmed", "cancelled"] as const,
			}),
			ranking_score_delta: S.Number(),
			winner: S.Optional(S.Id()),
			player1: S.RelationById("users", "$player_1"),
			player2: S.RelationById("users", "$player_2"),
			umpireUser: S.RelationById("users", "$umpire"),
			event: S.RelationById("events", "$event_id"),
			games: S.RelationMany("games", {
				where: [["match_id", "=", "$id"]],
			}),
		}),
		permissions: {
			...defaultPermissions,
			user: {
				...userReadOnly,
				insert: {
					filter: [
						["player_1", "=", "$role.userId"],
						["player_2", "=", "$role.userId"],
						["umpire", "=", "$role.userId"],
					],
				},
				update: {
					filter: [
						["player_1", "=", "$role.userId"],
						["player_2", "=", "$role.userId"],
						["umpire", "=", "$role.userId"],
					],
				},
				delete: {
					filter: [
						["player_1", "=", "$role.userId"],
						["player_2", "=", "$role.userId"],
						["umpire", "=", "$role.userId"],
					],
				},
			},
			anonymous: {
				read: { filter: [true] },
			},
		},
	},
	games: {
		schema: S.Schema({
			id: S.Id(),
			match_id: S.Id(),
			player_1_score: S.Number(),
			player_2_score: S.Number(),
			final_score: S.Optional(S.String()),
			started_at: S.Date(),
			completed_at: S.Optional(S.Date()),
			last_edited_at: S.Date(),
			game_number: S.Number(),
			match: S.RelationById("matches", "$match_id"),
			editor: S.RelationById("users", "$edited_by"),
			created_at: S.Date({ default: S.Default.now() }),
			updated_at: S.Date({ default: S.Default.now() }),
			updated_by: S.Optional(S.Id()),
		}),
		permissions: {
			...defaultPermissions,
			user: {
				...userReadOnly,
				insert: {
					filter: [true],
				},
				update: {
					filter: [true],
				},
			},
		},
	},
	leagues: {
		schema: S.Schema({
			id: S.Id(),
			name: S.String(),
			description: S.String(),
			logo_image_url: S.String(),
			faq_html: S.String(),
			club_ids: S.Set(S.Id()),
			admins: S.Set(S.Id()),
			created_at: S.Date({ default: S.Default.now() }),
			updated_at: S.Date({ default: S.Default.now() }),
			updated_by: S.Id(),
			clubs: S.RelationMany("clubs", {
				where: [["id", "in", "$club_ids"]],
			}),
			players: S.RelationMany("users", {
				where: [["registered_league_ids", "has", "$id"]],
			}),
			seasons: S.RelationMany("seasons", {
				where: [["league_id", "=", "$id"]],
			}),
		}),
		permissions: defaultPermissions,
	},
	seasons: {
		schema: S.Schema({
			id: S.Id(),
			name: S.String(),
			league_id: S.Id(),
			start_date: S.Date(),
			end_date: S.Date(),
			status: S.String({
				enum: ["active", "upcoming", "completed"] as const,
			}),
			rules_html: S.String(),
			created_at: S.Date({ default: S.Default.now() }),
			updated_at: S.Date({ default: S.Default.now() }),
			updated_by: S.Id(),
			league: S.RelationById("leagues", "$league_id"),
		}),
		permissions: defaultPermissions,
	},
} satisfies ClientSchema;

export type Event = Entity<typeof schema, "events">;
export type Club = Entity<typeof schema, "clubs">;
export type League = Entity<typeof schema, "leagues">;
export type Season = Entity<typeof schema, "seasons">;
export type User = Entity<typeof schema, "users">;
export type EventRegistration = Entity<typeof schema, "event_registrations">;
export type Match = Entity<typeof schema, "matches">;
export type Game = Entity<typeof schema, "games">;
