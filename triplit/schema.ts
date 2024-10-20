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
			rating: S.Number(),
			matches_played: S.Number(),
			wins: S.Number(),
			losses: S.Number(),
			no_shows: S.Number(),
			events: S.RelationMany("event_registrations", {
				where: [["$user_id", "=", "$id"]],
			}),
			matches: S.RelationMany("matches", {
				where: [
					["$player_1", "=", "$id"],
					["$player_2", "=", "$id"],
				],
			}),
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
			created_at: S.Date(),
			updated_at: S.Date(),
			club_id: S.Id(),
			club: S.RelationById("clubs", "$club_id"),
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
			created_at: S.Date(),
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
			created_at: S.Date(),
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
			started_at: S.Date(),
			first_completed_at: S.Date(),
			last_edited_at: S.Date(),
			edited_by: S.Id(),
			game_number: S.Number(),
			match: S.RelationById("matches", "$match_id"),
			editor: S.RelationById("users", "$edited_by"),
		}),
		permissions: defaultPermissions,
	},
} satisfies ClientSchema;

export type Event = Entity<typeof schema, "events">;
export type Club = Entity<typeof schema, "clubs">;
