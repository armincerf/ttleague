"use client";
import { Button } from "@/components/ui/button";
import { revalidateEvent, type Event } from "@/lib/actions/events";
import { client } from "@/lib/triplit";
import type { Match } from "@/triplit/schema";
import { useUser } from "@clerk/nextjs";
import { useQueryOne } from "@triplit/react";
import { addMinutes, subMinutes } from "date-fns";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { nanoid } from "nanoid";
import { TableNumberSelector } from "@/components/form/TableNumberSelector";
import { PlayerPicker } from "@/components/PlayerPicker";

interface AdminEventActionsProps {
	event: NonNullable<Event>;
}

const schema = z.object({
	player1Id: z.string().min(1, "Player 1 ID is required"),
	player2Id: z.string().min(1, "Player 2 ID is required"),
	tableNumber: z.number().min(1).max(4, "Table number must be between 1 and 4"),
});

function CreateMatchDialog({
	eventId,
	onClose,
}: { eventId: string; onClose: () => void }) {
	const form = useForm({
		defaultValues: {
			player1Id: "",
			player2Id: "",
			tableNumber: 1,
		},
		validatorAdapter: zodValidator(),
		validators: {
			onSubmit: schema,
		},
		onSubmit: async ({ value }) => {
			const match: Match = {
				id: nanoid(),
				player_1: value.player1Id,
				player_2: value.player2Id,
				table_number: value.tableNumber,
				event_id: eventId,
				manually_created: true,
				best_of: 5,
				created_at: new Date(),
				updated_at: new Date(),
				edited_at: new Date(),
				status: "pending",
				ranking_score_delta: 0,
				playersConfirmed: new Set(),
				umpireConfirmed: false,
				startTime: new Date(),
			};

			await client.insert("matches", match);
			revalidateEvent(eventId);
			onClose();
		},
	});

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Create New Match</DialogTitle>
			</DialogHeader>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					void form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field name="player1Id">
					{(field) => (
						<FormItem>
							<FormLabel>Player 1</FormLabel>
							<FormControl>
								<PlayerPicker
									value={field.state.value}
									onChange={field.handleChange}
								/>
							</FormControl>
							{field.state.meta.errors && (
								<p className="text-sm text-destructive">
									{field.state.meta.errors.join(", ")}
								</p>
							)}
						</FormItem>
					)}
				</form.Field>

				<form.Field name="player2Id">
					{(field) => (
						<FormItem>
							<FormLabel>Player 2</FormLabel>
							<FormControl>
								<PlayerPicker
									multiple={false}
									value={field.state.value}
									onChange={field.handleChange}
								/>
							</FormControl>
							{field.state.meta.errors && (
								<p className="text-sm text-destructive">
									{field.state.meta.errors.join(", ")}
								</p>
							)}
						</FormItem>
					)}
				</form.Field>

				<form.Field name="tableNumber">
					{(field) => (
						<TableNumberSelector
							value={field.state.value}
							onChange={field.handleChange}
						/>
					)}
				</form.Field>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button type="submit" disabled={!canSubmit || isSubmitting}>
							Create Match
						</Button>
					)}
				</form.Subscribe>
			</form>
		</DialogContent>
	);
}

async function generateRandomMatches(eventId: string, count: number) {
	const matches: Match[] = Array.from({ length: count }, () => ({
		id: nanoid(),
		player_1: nanoid(),
		player_2: nanoid(),
		table_number: Math.floor(Math.random() * 4) + 1,
		best_of: 5,
		event_id: eventId,
		manually_created: true,
		created_at: new Date(),
		updated_at: new Date(),
		edited_at: new Date(),
		status: "pending",
		ranking_score_delta: 0,
		playersConfirmed: new Set(),
		umpireConfirmed: false,
		startTime: new Date(),
	}));

	for (const match of matches) {
		await client.insert("matches", match);
	}
	revalidateEvent(eventId);
}

export function AdminEventActions({ event }: AdminEventActionsProps) {
	const [createMatchOpen, setCreateMatchOpen] = useState(false);

	const handleSetStatus = async (status: NonNullable<Event>["status"]) => {
		const now = new Date();
		let newStartTime = event.start_time;
		let newEndTime = event.end_time;

		if (status === "scheduled") {
			const existingMatches = await client.fetch(
				client
					.query("matches")
					.where("event_id", "=", event.id)
					.select(["id"])
					.build(),
			);
			if (existingMatches.length > 0) {
				for (const match of existingMatches) {
					await client.delete("matches", match.id);
				}
			}
			newStartTime = addMinutes(now, 30);
		} else if (status === "active") {
			newStartTime = subMinutes(now, 10);
			newEndTime = addMinutes(now, 110);
		} else if (status === "completed") {
			newEndTime = subMinutes(now, 10);
		}

		await client.update("events", event.id, (e) => {
			e.status = status;
			e.start_time = newStartTime;
			e.end_time = newEndTime;
		});
		revalidateEvent(event.id);
	};

	const { result } = useQueryOne(
		client,
		client
			.query("events")
			.where("id", "=", event.id)
			.select(["status"])
			.build(),
	);
	const status = result?.status ?? event.status;

	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<h4 className="font-medium">Set Event Status</h4>
				<div className="flex flex-col gap-2">
					<Button
						variant="outline"
						onClick={() => handleSetStatus("scheduled")}
						disabled={status === "scheduled"}
					>
						Set as Scheduled
					</Button>
					<Button
						variant="outline"
						onClick={() => handleSetStatus("active")}
						disabled={status === "active"}
					>
						Set as Active
					</Button>
					<Button
						variant="outline"
						onClick={() => handleSetStatus("completed")}
						disabled={status === "completed"}
					>
						Set as Completed
					</Button>
				</div>
			</div>

			<div className="space-y-4">
				<h4 className="font-medium">Manage Matches</h4>
				<div className="flex flex-col gap-2">
					<Dialog open={createMatchOpen} onOpenChange={setCreateMatchOpen}>
						<DialogTrigger asChild>
							<Button variant="outline">Create New Match</Button>
						</DialogTrigger>
						<CreateMatchDialog
							eventId={event.id}
							onClose={() => setCreateMatchOpen(false)}
						/>
					</Dialog>
					<Button
						variant="outline"
						onClick={() => generateRandomMatches(event.id, 4)}
					>
						Generate Random Matches
					</Button>
				</div>
			</div>
		</div>
	);
}
