"use client";

import { useQuery, useQueryOne } from "@triplit/react";
import { client } from "../adminClient";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateEventSuggestion } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { ComboBox } from "@/components/ComboBox";
import { format, addWeeks, addDays, isBefore } from "date-fns";

const eventSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string(),
	start_time: z.date(),
	end_time: z.date(),
	club_id: z.string().min(1, "Club is required"),
	league_id: z.string().min(1, "League is required"),
	tables: z.number().min(1),
	capacity: z.number().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

async function generateEventId(values: {
	start_time: Date;
	end_time: Date;
	club_id: string;
	league_id: string;
}) {
	const idString = `${values.start_time.toISOString()}_${values.end_time.toISOString()}_${values.club_id}_${values.league_id}`;

	const msgBuffer = new TextEncoder().encode(idString);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	const timestamp = format(values.start_time, 'dd_MMM_yy');

	const clubPrefix = values.club_id.slice(0, 6);
	const leaguePrefix = values.league_id.slice(0, 6);

	const hashPart = hashHex.slice(0, 8);

	return `${clubPrefix}_${leaguePrefix}_${timestamp}_${hashPart}`;
}

export function CreateEventDialog({ onClose }: { onClose: () => void }) {
	const { toast } = useToast();
	const [isGenerating, setIsGenerating] = useState(false);

	const { result: latestEvent } = useQueryOne(
		client,
		client.query("events").order("created_at", "DESC"),
	);

	const { results: clubs } = useQuery(client, client.query("clubs"));

	const { results: leagues } = useQuery(client, client.query("leagues"));

	const defaultStartTime = new Date();
	defaultStartTime.setMinutes(0);
	defaultStartTime.setSeconds(0);
	defaultStartTime.setMilliseconds(0);
	defaultStartTime.setHours(defaultStartTime.getHours() + 1);

	const form = useForm({
		defaultValues: {
			name: latestEvent?.name ?? "",
			description: latestEvent?.description ?? "",
			start_time: defaultStartTime,
			end_time: new Date(defaultStartTime.getTime() + 2 * 60 * 60 * 1000),
			club_id: latestEvent?.club_id ?? "",
			league_id: latestEvent?.league_id ?? "",
			tables: latestEvent?.tables
				? Math.max(...Array.from(latestEvent.tables))
				: 4,
			capacity: latestEvent?.capacity ?? 16,
		},
		onSubmit: async ({ value }) => {
			if (!eventSchema.safeParse(value).success) return;
			const id = await generateEventId(value);

			await client.insert("events", {
				id,
				name: value.name,
				description: value.description,
				start_time: value.start_time,
				end_time: value.end_time,
				club_id: value.club_id,
				league_id: value.league_id,
				tables: new Set(Array.from({ length: value.tables }, (_, i) => i + 1)),
				capacity: value.capacity,
				status: "scheduled",
				created_at: new Date(),
				updated_at: new Date(),
			});
			toast({
				title: "Event created",
				description: `Event ${id} created successfully`,
			});
			onClose();
		},
	});

	const handleGenerateSuggestion = async () => {
		if (!latestEvent) return;

		setIsGenerating(true);
		try {
			const result = await generateEventSuggestion({
				name: latestEvent.name,
				description: latestEvent.description ?? "",
				start_time: latestEvent.start_time,
				end_time: latestEvent.end_time,
				club_id: latestEvent.club_id,
				league_id: latestEvent.league_id,
				tables: Array.from(latestEvent.tables),
				capacity: latestEvent.capacity ?? 16,
			});

			if (result.error) {
				let errorMessage = "Failed to generate event suggestion";
				switch (result.error.code) {
					case "OPENAI_ERROR":
						errorMessage = "Failed to generate suggestion. Please try again.";
						break;
					case "VALIDATION_ERROR":
						errorMessage =
							"Generated suggestion was invalid. Please try again.";
						break;
					case "UNKNOWN_ERROR":
						errorMessage = "An unexpected error occurred. Please try again.";
						break;
				}
				toast({
					title: "Error",
					description: errorMessage,
					variant: "destructive",
				});
				return;
			}

			form.setFieldValue("name", result.data.name);
			form.setFieldValue("description", result.data.description);
			form.setFieldValue("start_time", new Date(result.data.start_time));
			form.setFieldValue("end_time", new Date(result.data.end_time));
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to generate event suggestion",
				variant: "destructive",
			});
		} finally {
			setIsGenerating(false);
		}
	};

	const generateButtonText = useMemo(() => {
		if (isGenerating) return <Loader2 className="h-4 w-4 animate-spin" />;
		if (!latestEvent) return "No previous event";

		const today = new Date();
		const oneWeekFromPrev = addWeeks(latestEvent.start_time, 1);
		const dayOfWeek = latestEvent.start_time.getDay();

		// If one week from previous event is in the past, find the next occurrence of the same day
		let nextDate = oneWeekFromPrev;
		if (isBefore(oneWeekFromPrev, today)) {
			nextDate = today;
			while (nextDate.getDay() !== dayOfWeek) {
				nextDate = addDays(nextDate, 1);
			}
		}

		return `Generate fields for ${format(nextDate, "EEEE do MMMM")}`;
	}, [isGenerating, latestEvent]);

	return (
		<DialogContent
			className="sm:max-w-[500px] overflow-y-auto h-[90vh]"
			description="Create a new event based on the previous event's settings"
		>
			<DialogHeader>
				<DialogTitle className="flex justify-between items-center">
					Create New Event
					<Button
						variant="outline"
						size="sm"
						onClick={handleGenerateSuggestion}
						disabled={isGenerating || !latestEvent}
					>
						{generateButtonText}
					</Button>
				</DialogTitle>
			</DialogHeader>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					void form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field name="name">
					{(field) => (
						<FormItem>
							<FormLabel>Event Name</FormLabel>
							<FormControl>
								<Input
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Enter event name..."
								/>
							</FormControl>
						</FormItem>
					)}
				</form.Field>

				<form.Field name="description">
					{(field) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Enter event description..."
								/>
							</FormControl>
						</FormItem>
					)}
				</form.Field>

				<div className="grid grid-cols-2 gap-4">
					<form.Field name="start_time">
						{(field) => (
							<FormItem>
								<FormLabel>Start Time</FormLabel>
								<FormControl>
									<Input
										type="datetime-local"
										value={field.state.value.toISOString().slice(0, 16)}
										onChange={(e) =>
											field.handleChange(new Date(e.target.value))
										}
									/>
								</FormControl>
							</FormItem>
						)}
					</form.Field>

					<form.Field name="end_time">
						{(field) => (
							<FormItem>
								<FormLabel>End Time</FormLabel>
								<FormControl>
									<Input
										type="datetime-local"
										value={field.state.value.toISOString().slice(0, 16)}
										onChange={(e) =>
											field.handleChange(new Date(e.target.value))
										}
									/>
								</FormControl>
							</FormItem>
						)}
					</form.Field>
				</div>

				<form.Field name="club_id">
					{(field) => (
						<FormItem>
							<FormLabel>Club</FormLabel>
							<FormControl>
								<ComboBox
									searchPlaceholder="Search clubs..."
									emptyText="No clubs found"
									options={
										clubs?.map((club) => ({
											value: club.id,
											label: club.name,
										})) ?? []
									}
									value={field.state.value}
									onChange={field.handleChange}
									placeholder="Select club..."
								/>
							</FormControl>
						</FormItem>
					)}
				</form.Field>

				<form.Field name="league_id">
					{(field) => (
						<FormItem>
							<FormLabel>League</FormLabel>
							<FormControl>
								<ComboBox
									searchPlaceholder="Search leagues..."
									emptyText="No leagues found"
									options={
										leagues?.map((league) => ({
											value: league.id,
											label: league.name,
										})) ?? []
									}
									value={field.state.value}
									onChange={field.handleChange}
									placeholder="Select league..."
								/>
							</FormControl>
						</FormItem>
					)}
				</form.Field>

				<form.Field name="tables">
					{(field) => (
						<FormItem>
							<FormLabel>Number of Tables</FormLabel>
							<FormControl>
								<Input
									type="number"
									value={field.state.value}
									onChange={(e) => field.handleChange(Number(e.target.value))}
									min={1}
									max={10}
									placeholder="Enter number of tables..."
								/>
							</FormControl>
						</FormItem>
					)}
				</form.Field>

				<form.Field name="capacity">
					{(field) => (
						<FormItem>
							<FormLabel>Capacity</FormLabel>
							<FormControl>
								<Input
									type="number"
									value={field.state.value}
									onChange={(e) => field.handleChange(Number(e.target.value))}
									min={2}
								/>
							</FormControl>
						</FormItem>
					)}
				</form.Field>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button
							type="submit"
							disabled={!canSubmit || isSubmitting}
							className="w-full"
						>
							{isSubmitting ? "Creating..." : "Create Event"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</DialogContent>
	);
}
