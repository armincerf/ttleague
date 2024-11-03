import { PLAY_STYLES, RUBBER_TYPES } from "@/lib/constants";
import {
  type ClientSchema,
  type Entity,
  or,
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
      type: "user",
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
      table_tennis_england_id: S.Optional(S.String()),
      email: S.String(),
      profile_image_url: S.Optional(S.String()),
      first_name: S.String(),
      last_name: S.String(),
      bio: S.Optional(S.String()),
      playStyle: S.Optional(S.String({ enum: PLAY_STYLES })),
      forehandRubber: S.Optional(
        S.String({
          enum: RUBBER_TYPES,
        })
      ),
      backhandRubber: S.Optional(
        S.String({
          enum: RUBBER_TYPES,
        })
      ),
      gender: S.Optional(S.String({ enum: ["male", "female"] as const })),
      current_division: S.Optional(S.String()),
      default_min_opponent_level: S.Optional(S.String()),
      default_max_opponent_level: S.Optional(S.String()),
      rating: S.Number(),
      matches_played: S.Number(),
      wins: S.Number(),
      losses: S.Number(),
      no_shows: S.Number(),
      current_tournament_priority: S.Optional(S.Number({ default: 0 })),
      registered_league_ids: S.Set(S.String()),
      leagues: S.RelationMany("leagues", {
        where: [["id", "in", "$registered_league_ids"]],
      }),
      events: S.RelationMany("event_registrations", {
        where: [["user_id", "=", "$id"]],
      }),
      matches: S.RelationMany("matches", {
        where: [
          or([
            ["player_1", "=", "$id"],
            ["player_2", "=", "$id"],
          ]),
        ],
      }),
      created_at: S.Date({ default: S.Default.now() }),
      updated_at: S.Date({ default: S.Default.now() }),
      updated_by: S.Optional(S.String()),
      conversations: S.RelationMany("conversations", {
        where: [["members", "has", "$id"]],
      }),
    }),
    permissions: {
      admin: adminFullAccess,
      user: {
        ...userReadOnly,
        insert: {
          filter: [["id", "=", "$role.userId"]],
        },
        // TODO - just for local test
        update: { filter: [true] },
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
      admins: S.Set(S.String()),
      latitude: S.Number(),
      longitude: S.Number(),
      mapsLink: S.Optional(S.String()),
      events: S.RelationMany("events", {
        where: [["club_id", "=", "$id"]],
      }),
      created_at: S.Date({ default: S.Default.now() }),
      updated_at: S.Date({ default: S.Default.now() }),
      updated_by: S.Optional(S.String()),
    }),
    permissions: defaultPermissions,
  },
  events: {
    schema: S.Schema({
      id: S.Id(),
      name: S.String(),
      description: S.Optional(S.String()),
      price_gbp: S.Optional(S.Number()),
      paymentOptions: S.Optional(
        S.Set(S.String({ enum: ["cash", "card", "in-app"] }))
      ),
      start_time: S.Date(),
      end_time: S.Date(),
      created_at: S.Date({ default: S.Default.now() }),
      updated_at: S.Date({ default: S.Default.now() }),
      updated_by: S.Optional(S.String()),
      club_id: S.String(),
      league_id: S.String(),
      season_id: S.Optional(S.String()),
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

      club: S.RelationById("clubs", "$club_id"),
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
      user_id: S.String(),
      event_id: S.String(),
      league_id: S.String(),
      created_at: S.Date({ default: S.Default.now() }),
      updated_at: S.Date({ default: S.Default.now() }),
      updated_by: S.Optional(S.String()),
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
      player_1: S.String(),
      player_2: S.String(),
      umpire: S.Optional(S.String()),
      best_of: S.Number({ default: 3 }),
      manually_created: S.Boolean(),
      event_id: S.String(),
      table_number: S.Number(),
      created_at: S.Date({ default: S.Default.now() }),
      updated_at: S.Date({ default: S.Default.now() }),
      updated_by: S.Optional(S.String()),
      edited_at: S.Date({ default: S.Default.now() }),
      status: S.String({
        enum: [
          "pending",
          "confirmed",
          "cancelled",
          "ended",
          "ongoing",
        ] as const,
      }),
      ranking_score_delta: S.Number(),
      winner: S.Optional(S.String()),
      player1: S.RelationById("users", "$player_1"),
      player2: S.RelationById("users", "$player_2"),
      umpireUser: S.RelationById("users", "$umpire"),
      event: S.RelationById("events", "$event_id"),
      games: S.RelationMany("games", {
        where: [["match_id", "=", "$id"]],
      }),
      playersConfirmed: S.Set(S.String()),
      umpireConfirmed: S.Boolean({ default: false }),
      startTime: S.Date({ default: S.Default.now() }),
      endTime: S.Optional(S.Date()),
    }),
  },
  games: {
    schema: S.Schema({
      id: S.Id(),
      match_id: S.String(),
      player_1_score: S.Number(),
      player_2_score: S.Number(),
      score_history_blob: S.Optional(S.String()),
      started_at: S.Date({ default: S.Default.now() }),
      completed_at: S.Optional(S.Date()),
      last_edited_at: S.Date({ default: S.Default.now() }),
      game_number: S.Number(),
      current_server: S.Optional(S.Number()),
      match: S.RelationById("matches", "$match_id"),
      editor: S.RelationById("users", "$edited_by"),
      created_at: S.Date({ default: S.Default.now() }),
      updated_at: S.Date({ default: S.Default.now() }),
      updated_by: S.Optional(S.String()),
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
      club_ids: S.Set(S.String()),
      admins: S.Set(S.String()),
      created_at: S.Date({ default: S.Default.now() }),
      updated_at: S.Date({ default: S.Default.now() }),
      updated_by: S.String(),
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
      league_id: S.String(),
      start_date: S.Date(),
      end_date: S.Date(),
      status: S.String({
        enum: ["active", "upcoming", "completed"] as const,
      }),
      rules_html: S.String(),
      created_at: S.Date({ default: S.Default.now() }),
      updated_at: S.Date({ default: S.Default.now() }),
      updated_by: S.String(),
      league: S.RelationById("leagues", "$league_id"),
    }),
    permissions: defaultPermissions,
  },
  reactions: {
    schema: S.Schema({
      id: S.Id(),
      createdAt: S.Date({ default: S.Default.now() }),
      messageId: S.String(),
      message: S.RelationById("messages", "$messageId"),
      userId: S.String(),
      emoji: S.String(),
    }),
    permissions: {
      ...defaultPermissions,
      user: {
        read: {
          // You may only read reactions to messages you are a member of
          filter: [["message.convo.members", "=", "$role.userId"]],
        },
        insert: {
          // You may only react to messages in conversations you are a member of
          filter: [
            ["message.convo.members", "=", "$role.userId"],
            ["userId", "=", "$role.userId"],
          ],
        },
        delete: {
          // You may only delete your own reactions
          filter: [
            ["message.convo.members", "=", "$role.userId"],
            ["userId", "=", "$role.userId"],
          ],
        },
      },
    },
  },
  messages: {
    schema: S.Schema({
      id: S.Id(),
      conversationId: S.String(),
      sender_id: S.String(),
      sender: S.RelationById("users", "$sender_id"),
      text: S.String(),
      created_at: S.Date({ default: S.Default.now() }),
      likes: S.Optional(S.Set(S.String())),
      convo: S.RelationById("conversations", "$conversationId"),
      reactions: S.RelationMany("reactions", {
        where: [["messageId", "=", "$id"]],
      }),
    }),
    permissions: {
      ...defaultPermissions,
      user: {
        read: {
          // You may only read messages in conversations you are a member of
          filter: [["convo.members", "=", "$role.userId"]],
        },
        insert: {
          // You may only author your own message and must be a member of the conversation
          filter: [
            ["convo.members", "=", "$role.userId"],
            ["sender_id", "=", "$role.userId"],
          ],
        },
      },
    },
  },
  conversations: {
    schema: S.Schema({
      id: S.Id(),
      name: S.String(),
      members: S.Set(S.String()),
      membersInfo: S.RelationMany("users", {
        where: [["id", "in", "$members"]],
      }),
    }),
    permissions: {
      ...defaultPermissions,
      user: {
        read: {
          // You may only read conversations you are a member of
          filter: [["members", "=", "$role.userId"]],
        },
        insert: {
          // You may only create a conversation you are a member of it
          filter: [["members", "=", "$role.userId"]],
        },
        update: {
          // You may only update a conversation you are a member of it
          filter: [["members", "=", "$role.userId"]],
        },
      },
    },
  },
  admin_actions: {
    schema: S.Schema({
      id: S.Id(),
      action: S.String(),
      user_id: S.Optional(S.String()),
      acknowledged: S.Optional(S.Set(S.String())),
      created_at: S.Date({ default: S.Default.now() }),
    }),
  },
  active_tournaments: {
    schema: S.Schema({
      id: S.Id(),
      event_id: S.String(),
      status: S.String({
        enum: ["idle", "started", "finished"] as const,
        default: "idle",
      }),
      player_ids: S.Set(S.String()),
      bracket_type: S.String({
        enum: ["single_elimination", "round_robin"] as const,
        default: "round_robin",
      }),
      total_rounds: S.Number({ default: 1 }),
      created_at: S.Date({ default: S.Default.now() }),
      updated_at: S.Date({ default: S.Default.now() }),
      updated_by: S.Optional(S.String()),

      // Relations
      event: S.RelationById("events", "$event_id"),
      players: S.RelationMany("users", {
        where: [["id", "in", "$player_ids"]],
      }),
      matches: S.RelationMany("matches", {
        where: [
          ["event_id", "=", "$event_id"],
          ["status", "!=", "cancelled"],
        ],
      }),
    }),
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
export type Conversation = Entity<typeof schema, "conversations">;
export type Message = Entity<typeof schema, "messages">;
export type Reaction = Entity<typeof schema, "reactions">;
export type ActiveTournament = Entity<typeof schema, "active_tournaments">;
