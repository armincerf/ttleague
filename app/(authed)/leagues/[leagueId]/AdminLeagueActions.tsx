"use client";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/triplit";
import { addDays, addHours, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { TableNumberSelector } from "@/components/form/TableNumberSelector";

interface AdminLeagueActionsProps {
	leagueId: string;
}

function CreateEventForm({
	leagueId,
	defaultEvent,
	onSuccess,
}: {
	leagueId: string;
	defaultEvent: {
		name: string;
		description: string;
		start_time: Date;
		end_time: Date;
		tables: Set<number>;
	};
	onSuccess: () => void;
}) {
	const [event, setEvent] = useState(defaultEvent);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const eventId = crypto.randomUUID();
		await client.insert("events", {
			id: eventId,
			league_id: leagueId,
			...event,
			status: "scheduled",
			created_at: new Date(),
			updated_at: new Date(),
		});
		console.log("event", event);
		onSuccess();
	};

	const handleTableToggle = (tables: number[]) => {
		setEvent((prev) => {
			const newTables = new Set(prev.tables);
			for (const table of tables) {
				if (newTables.has(table)) {
					newTables.delete(table);
				} else {
					newTables.add(table);
				}
			}
			return { ...prev, tables: newTables };
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label className="text-sm" htmlFor="name">
					Name
				</label>
				<Input
					id="name"
					value={event.name}
					onChange={(e) =>
						setEvent((prev) => ({ ...prev, name: e.target.value }))
					}
				/>
			</div>
			<div>
				<label className="text-sm" htmlFor="description">
					Description
				</label>
				<Input
					id="description"
					value={event.description}
					onChange={(e) =>
						setEvent((prev) => ({ ...prev, description: e.target.value }))
					}
				/>
			</div>
			<div>
				<label className="text-sm" htmlFor="start_time">
					Start Time
				</label>
				<Input
					id="start_time"
					type="datetime-local"
					value={event.start_time.toISOString().slice(0, 16)}
					onChange={(e) =>
						setEvent((prev) => ({
							...prev,
							start_time: new Date(e.target.value),
						}))
					}
				/>
			</div>
			<div>
				<label className="text-sm" htmlFor="end_time">
					End Time
				</label>
				<Input
					id="end_time"
					type="datetime-local"
					value={event.end_time.toISOString().slice(0, 16)}
					onChange={(e) =>
						setEvent((prev) => ({
							...prev,
							end_time: new Date(e.target.value),
						}))
					}
				/>
			</div>
			<div>
				<label className="text-sm" htmlFor="tables">
					Tables
				</label>
				<TableNumberSelector
					value={Array.from(event.tables)}
					onChange={handleTableToggle}
					maxTables={12}
					multiple
					label="Available Tables"
				/>
			</div>
			<Button type="submit">Create Event</Button>
		</form>
	);
}

export function AdminLeagueActions({ leagueId }: AdminLeagueActionsProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	const createRandomEvent = async (isPast = false) => {
		const now = new Date();
		const startTime = isPast
			? subDays(now, Math.floor(Math.random() * 30))
			: addDays(now, Math.floor(Math.random() * 30));
		const endTime = addHours(startTime, 2);

		const eventId = crypto.randomUUID();
		await client.insert("events", {
			id: eventId,
			league_id: leagueId,
			name: `${isPast ? "Past" : "Future"} Event ${Math.floor(Math.random() * 1000)}`,
			description: "Random event description",
			start_time: startTime,
			end_time: endTime,
			status: isPast ? "completed" : "scheduled",
			created_at: now,
			updated_at: now,
		});
	};

	const defaultEvent = {
		name: "New Event",
		description: "Event description",
		start_time: addDays(new Date(), 1),
		end_time: addDays(new Date(), 1),
		tables: new Set<number>(),
	};

	return (
		<div className="space-y-4">
			<h4 className="font-medium">Create Events</h4>
			<div className="flex flex-col gap-2">
				<Button variant="outline" onClick={() => createRandomEvent(false)}>
					Create Random Future Event
				</Button>
				<Button variant="outline" onClick={() => createRandomEvent(true)}>
					Create Random Past Event
				</Button>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button variant="outline">Create Custom Event</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create Custom Event</DialogTitle>
						</DialogHeader>
						<DialogDescription>
							Create a custom event for this league.
						</DialogDescription>
						<CreateEventForm
							leagueId={leagueId}
							defaultEvent={defaultEvent}
							onSuccess={() => setOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
