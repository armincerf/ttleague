"use client";
import { Button } from "@/components/ui/button";
import { revalidateEvent, type Event } from "@/lib/actions/events";
import { client } from "@/lib/triplit";
import type { Match } from "@/triplit/schema";
import { useUser } from "@clerk/nextjs";
import { useQueryOne } from "@triplit/react";
import { addMinutes, subMinutes } from "date-fns";

interface AdminEventActionsProps {
	event: Event;
}

async function addMatches(eventId: string, userId: string) {
	const mockMatches: Match[] = [
		{
			id: "mockMatch1",
			player_1: userId,
			player_2: Math.floor(Math.random() * 100).toString(),
			table_number: 1,
			event_id: eventId,
			manually_created: true,
			created_at: new Date(),
			updated_at: new Date(),
			edited_at: new Date(),
			status: "pending",
			ranking_score_delta: 0,
		},
	];
	for (const match of mockMatches) {
		await client.insert("matches", match);
	}
}

export function AdminEventActions({ event }: AdminEventActionsProps) {
	const { user } = useUser();

	const handleSetStatus = async (status: Event["status"]) => {
		const now = new Date();
		let newStartTime = event.start_time;
		let newEndTime = event.end_time;

		if (status === "scheduled") {
			newStartTime = addMinutes(now, 30);
		} else if (status === "active") {
			newStartTime = subMinutes(now, 10);
			newEndTime = subMinutes(now, 10);
		} else if (status === "completed") {
			newEndTime = subMinutes(now, 10);
		}

		if (status === "active" && user) {
			await addMatches(event.id, user.id);
		}

		await client.update("events", event.id, (e) => {
			e.status = status;
			e.start_time = newStartTime;
			e.end_time = newEndTime;
		});
		revalidateEvent(event.id);
		console.log("updated event", event.id);
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
	);
}
