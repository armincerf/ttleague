"use client";

import { useQuery, useQueryOne } from "@triplit/react";
import { client } from "../adminClient";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ComboBox } from "@/components/ComboBox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

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

export function EditEventDialog({
	eventId,
	onClose,
}: {
	eventId: string;
	onClose: () => void;
}) {
	const { toast } = useToast();
	const [isDeleting, setIsDeleting] = useState(false);
	const [activeTab, setActiveTab] = useState("details");

	const { result: event } = useQueryOne(
		client,
		client.query("events").where(["id", "=", eventId]),
	);

	const { results: clubs } = useQuery(client, client.query("clubs"));
	const { results: leagues } = useQuery(client, client.query("leagues"));
	const { results: users } = useQuery(
		client,
		client.query("users").select(["id", "first_name", "last_name"]),
	);

	const form = useForm({
		defaultValues: {
			name: event?.name ?? "",
			description: event?.description ?? "",
			start_time: event ? new Date(event.start_time) : new Date(),
			end_time: event ? new Date(event.end_time) : new Date(),
			club_id: event?.club_id ?? "",
			league_id: event?.league_id ?? "",
			tables: event?.tables ? Math.max(...Array.from(event.tables)) : 4,
			capacity: event?.capacity ?? 16,
		},
		onSubmit: async ({ value }) => {
			if (!event || !eventSchema.safeParse(value).success) return;

			await client.update("events", event.id, (old) => {
				old.name = value.name;
				old.description = value.description;
				old.start_time = value.start_time;
				old.end_time = value.end_time;
				old.club_id = value.club_id;
				old.league_id = value.league_id;
				old.tables = new Set(
					Array.from({ length: value.tables }, (_, i) => i + 1),
				);
				old.capacity = value.capacity;
				old.updated_at = new Date();
			});

			toast({
				title: "Event updated",
				description: "Event updated successfully",
			});
			onClose();
		},
	});

	const handleDeleteEvent = async () => {
		if (!event) return;
		setIsDeleting(true);
		try {
			await client.delete("events", event.id);
			toast({
				title: "Event deleted",
				description: "Event deleted successfully",
			});
			onClose();
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to delete event",
				variant: "destructive",
			});
		} finally {
			setIsDeleting(false);
		}
	};

	if (!event) return null;

	return (
		<DialogContent className="sm:max-w-[600px] overflow-y-auto h-[90vh]">
			<DialogHeader>
				<DialogTitle className="flex justify-between items-center">
					Edit Event
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="destructive" size="sm">
								<Trash2 className="h-4 w-4 mr-2" />
								Delete Event
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will permanently delete the
									event and remove all associated data.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDeleteEvent}
									disabled={isDeleting}
								>
									{isDeleting ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										"Delete"
									)}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</DialogTitle>
				<DialogDescription>
					Edit event details or manage registrations
				</DialogDescription>
			</DialogHeader>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="details">Event Details</TabsTrigger>
					<TabsTrigger value="registrations">Registrations</TabsTrigger>
				</TabsList>

				<TabsContent value="details">
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
											onChange={(e) =>
												field.handleChange(Number(e.target.value))
											}
											min={1}
											max={10}
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
											onChange={(e) =>
												field.handleChange(Number(e.target.value))
											}
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
									{isSubmitting ? "Saving..." : "Save Changes"}
								</Button>
							)}
						</form.Subscribe>
					</form>
				</TabsContent>

				<TabsContent value="registrations" className="space-y-4">
					<div className="space-y-4">
						<ComboBox
							options={[
								{
									value: "new-user",
									label: "+ New User",
								},
								...(users?.map((user) => ({
									value: user.id,
									label: `${user.first_name} ${user.last_name}`,
								})) ?? []),
							]}
							searchPlaceholder="Search users..."
							emptyText="No users found"
							placeholder="Select user to register..."
							onChange={async (userId) => {
								if (!event) return;
								if (userId === "new-user") {
									// Handle new user registration
									return;
								}
								try {
									await client.insert("event_registrations", {
										id: `${event.id}_${userId}`,
										user_id: userId,
										event_id: event.id,
										league_id: event.league_id,
										created_at: new Date(),
										updated_at: new Date(),
										confidence_level: 1,
									});
									toast({
										title: "User registered",
										description: "User registered successfully",
									});
								} catch (error) {
									toast({
										title: "Error",
										description: "Failed to register user",
										variant: "destructive",
									});
								}
							}}
						/>

						{/* Add registered users list here */}
					</div>
				</TabsContent>
			</Tabs>
		</DialogContent>
	);
}
