"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useQuery } from "@triplit/react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { ComboBox } from "../manual-match-entry/components/ComboBox";
import { useToast } from "@/hooks/use-toast";
import { client } from "@/lib/triplit";
import type {
	Match,
	Game,
	EventRegistration,
	Message,
	Reaction,
} from "@/triplit/schema";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { or } from "@triplit/client";
const migrationSchema = z.object({
	oldUserId: z.string().min(1, "Old user is required"),
	newUserId: z.string().min(1, "New user is required"),
});

type MigrationFormValues = z.infer<typeof migrationSchema>;

type MigrationStats = {
	matches: Match[];
	games: Game[];
	eventRegistrations: EventRegistration[];
	messages: Message[];
	reactions: Reaction[];
};

function UserMigrationInner() {
	const { toast } = useToast();
	const [previewMode, setPreviewMode] = useState(true);

	const { results: users } = useQuery(
		client,
		client.query("users").select(["id", "first_name", "last_name", "email"]),
	);

	const { results: allMatches } = useQuery(
		client,
		client.query("matches").select(["player_1", "player_2", "umpire"]),
	);

	const getUserMatchCount = (userId: string) => {
		if (!allMatches) return 0;
		return allMatches.filter(
			(match) =>
				match.player_1 === userId ||
				match.player_2 === userId ||
				match.umpire === userId,
		).length;
	};

	const userOptions =
		users?.map((user) => ({
			value: user.id,
			label: `${user.first_name} ${user.last_name} (${user.email}) - ${getUserMatchCount(user.id)} matches`,
		})) ?? [];

	const form = useForm({
		defaultValues: {
			oldUserId: "",
			newUserId: "",
		} satisfies MigrationFormValues,
		onSubmit: async ({ value }) => {
			if (previewMode) return;

			try {
				await client.transact(async (tx) => {
					// Update matches
					for (const match of stats.matches) {
						await tx.update("matches", match.id, (m) => {
							if (m.player_1 === value.oldUserId) m.player_1 = value.newUserId;
							if (m.player_2 === value.oldUserId) m.player_2 = value.newUserId;
							if (m.umpire === value.oldUserId) m.umpire = value.newUserId;
							if (m.winner === value.oldUserId) m.winner = value.newUserId;
						});
					}

					// Update games
					for (const game of stats.games) {
						await tx.update("games", game.id, (g) => {
							if (g.winner === value.oldUserId) g.winner = value.newUserId;
						});
					}

					// Update event registrations
					for (const registration of stats.eventRegistrations) {
						await tx.update("event_registrations", registration.id, (r) => {
							r.user_id = value.newUserId;
						});
					}

					// Update messages
					for (const message of stats.messages) {
						await tx.update("messages", message.id, (m) => {
							m.sender_id = value.newUserId;
						});
					}

					// Update reactions
					for (const reaction of stats.reactions) {
						await tx.update("reactions", reaction.id, (r) => {
							r.userId = value.newUserId;
						});
					}

					// Delete the old user
					await tx.delete("users", value.oldUserId);
				});

				toast({
					title: "Success",
					description:
						"User data has been migrated and old user account deleted",
				});

				form.reset();
				setPreviewMode(true);
			} catch (error) {
				toast({
					title: "Error",
					description:
						error instanceof Error
							? error.message
							: "Failed to migrate user data",
					variant: "destructive",
				});
			}
		},
		validatorAdapter: zodValidator(),
		validators: {
			onSubmit: migrationSchema,
		},
	});

	// Query all relevant collections for the old user ID
	const { results: matches } = useQuery(
		client,
		client.query("matches").where([
			or([
				["player_1", "=", form.getFieldValue("oldUserId")],
				["player_2", "=", form.getFieldValue("oldUserId")],
				["umpire", "=", form.getFieldValue("oldUserId")],
			]),
		]),
	);

	const { results: games } = useQuery(
		client,
		client
			.query("games")
			.where([["winner", "=", form.getFieldValue("oldUserId")]]),
	);

	const { results: eventRegistrations } = useQuery(
		client,
		client
			.query("event_registrations")
			.where([["user_id", "=", form.getFieldValue("oldUserId")]]),
	);

	const { results: messages } = useQuery(
		client,
		client
			.query("messages")
			.where([["sender_id", "=", form.getFieldValue("oldUserId")]]),
	);

	const { results: reactions } = useQuery(
		client,
		client
			.query("reactions")
			.where([["userId", "=", form.getFieldValue("oldUserId")]]),
	);

	const stats: MigrationStats = {
		matches: matches ?? [],
		games: games ?? [],
		eventRegistrations: eventRegistrations ?? [],
		messages: messages ?? [],
		reactions: reactions ?? [],
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				void form.handleSubmit();
			}}
			className="space-y-6"
		>
			<div className="space-y-4">
				<div>
					<label htmlFor="oldUserId" className="block text-sm font-medium mb-1">
						Old User
					</label>
					<form.Field name="oldUserId">
						{(field) => (
							<ComboBox
								options={userOptions}
								value={field.state.value}
								onChange={field.handleChange}
								placeholder="Select user to migrate from..."
								searchPlaceholder="Search users..."
								emptyText="No users found"
							/>
						)}
					</form.Field>
				</div>
				<div>
					<label htmlFor="newUserId" className="block text-sm font-medium mb-1">
						New User
					</label>
					<form.Field name="newUserId">
						{(field) => (
							<ComboBox
								options={userOptions}
								value={field.state.value}
								onChange={field.handleChange}
								placeholder="Select user to migrate to..."
								searchPlaceholder="Search users..."
								emptyText="No users found"
							/>
						)}
					</form.Field>
				</div>
			</div>

			{form.getFieldValue("oldUserId") && (
				<div className="rounded-md border p-4">
					<h3 className="font-medium mb-4">Records to be updated:</h3>
					<ul className="space-y-2">
						<li>Matches: {stats.matches.length}</li>
						<li>Games: {stats.games.length}</li>
						<li>Event Registrations: {stats.eventRegistrations.length}</li>
						<li>Messages: {stats.messages.length}</li>
						<li>Reactions: {stats.reactions.length}</li>
					</ul>
				</div>
			)}

			<div className="space-x-4">
				<Button
					type="button"
					onClick={() => setPreviewMode(!previewMode)}
					variant="outline"
				>
					{previewMode ? "Proceed with Migration" : "Back to Preview"}
				</Button>
				<Button
					type="submit"
					disabled={
						form.state.isSubmitting ||
						previewMode ||
						!form.getFieldValue("oldUserId") ||
						!form.getFieldValue("newUserId")
					}
				>
					{form.state.isSubmitting ? "Migrating..." : "Migrate User Data"}
				</Button>
			</div>
		</form>
	);
}

const queryClient = new QueryClient();
export default function UserMigration() {
	if (typeof window === "undefined") return null;
	return (
		<QueryClientProvider client={queryClient}>
			<UserMigrationInner />
		</QueryClientProvider>
	);
}
