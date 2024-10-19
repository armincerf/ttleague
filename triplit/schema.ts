import { type ClientSchema, type Roles, Schema as S } from "@triplit/client";

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
};

export const schema = {
	users: {
		schema: S.Schema({
			id: S.Id(),
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
		}),
		permissions: {
			admin: adminFullAccess,
			user: {
				...userReadOnly,
				update: { filter: [["id", "=", "$role.userId"]] },
				delete: { filter: [["id", "=", "$role.userId"]] },
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
		}),
		permissions: defaultPermissions,
	},
	events: {
		schema: S.Schema({
			id: S.Id(),
			name: S.String(),
			description: S.String(),
			start_time: S.Date(),
			club_id: S.Id(),
			best_of: S.Number(),
			tables: S.Set(S.Number()),
			status: S.String({
				enum: [
					"draft",
					"scheduled",
					"active",
					"completed",
					"cancelled",
				] as const,
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
		}),
		permissions: {
			admin: adminFullAccess,
			user: {
				insert: {
					filter: [["user_id", "=", "$role.userId"]],
				},
				delete: {
					filter: [["user_id", "=", "$role.userId"]],
				},
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
		}),
		permissions: defaultPermissions,
	},
} satisfies ClientSchema;
