"use client";

import { useQuery, useQueryOne } from "@triplit/react";
import { client } from "@/lib/triplit";
import { ComboBox } from "@/components/ComboBox";
import { qrcodegen } from "@/lib/qrcodegen";
import { useState, useEffect, useCallback } from "react";
import { AnimatedTick } from "@/components/AnimatedTick";
import { Button } from "@/components/ui/button";
import { registerForEvent } from "@/app/(authed)/events/[eventId]/EventRegistrationButton";
import { useTransition } from "react";
import { toast } from "@/hooks/use-toast";

export function getQrCodeUrl(userId: string, latestEventId: string) {
	if (userId === "new-user") {
		return `${window.location.origin}/sign-up`;
	}
	return `https://play.ttmk.co.uk/${latestEventId}/game/${userId}`;
}

export function UserRegistrationForm() {
	const [selectedUserId, setSelectedUserId] = useState<string>("");
	const [selectedEventId, setSelectedEventId] = useState<string>("");
	const [isPending, startTransition] = useTransition();
	const { result: latestEvent } = useQueryOne(
		client,
		client.query("events").select(["id", "name", "league_id"]).order("start_time", "DESC"),
	);
	const { results: users } = useQuery(
		client,
		client
			.query("users")
			.select(["id", "first_name", "last_name"])
			.include("events", (rel) => rel("events").select(["event_id"]).build()),
	);
	const { results: events } = useQuery(
		client,
		client
			.query("events")
			.select(["id", "name", "start_time"])
			.where("start_time", ">", new Date())
			.order("start_time", "ASC")
	);

	useEffect(() => {
		if (events?.[0] && !selectedEventId) {
			setSelectedEventId(events[0].id);
		}
	}, [events, selectedEventId]);

	function userRegistered(user: NonNullable<typeof users>[number]) {
		return user.events.some((event) => event.event_id === latestEvent?.id);
	}
	console.log(users, latestEvent);

	const userOptions = [
		{
			value: "new-user",
			label: "+ New User",
		},
		...(users?.map((user) => ({
			value: user.id,
			label: `${user.first_name} ${user.last_name}`,
		})) ?? []),
	];

	const selectedUser = users?.find((user) => user.id === selectedUserId);

	// Update the qrCodeUrl to use the new function
	const qrCodeUrl = selectedUserId
		? getQrCodeUrl(selectedUserId, latestEvent?.id ?? "")
		: "";

	const generateQrCode = () => {
		if (!selectedUserId) return null;

		const qr = qrcodegen.QrCode.encodeText(
			qrCodeUrl,
			qrcodegen.QrCode.Ecc.MEDIUM,
		);
		const size = qr.size;
		const cellSize = 4; // Adjust this value to change QR code size
		const margin = 4;
		const canvas = document.createElement("canvas");
		canvas.width = canvas.height = (size + margin * 2) * cellSize;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;

		// Fill background
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw QR code cells
		ctx.fillStyle = "#000000";
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				if (qr.getModule(x, y)) {
					ctx.fillRect(
						(x + margin) * cellSize,
						(y + margin) * cellSize,
						cellSize,
						cellSize,
					);
				}
			}
		}

		return canvas.toDataURL();
	};

	const handleRegister = useCallback(() => {
		if (!selectedUserId || !selectedEventId) return;

		const eventRegistration = {
			id: `${selectedUserId}-${selectedEventId}`,
			league_id: latestEvent?.league_id ?? "",
			event_id: selectedEventId,
			user_id: selectedUserId,
			created_at: new Date(),
			updated_at: new Date(),
			confidence_level: 1,
		};

		startTransition(async () => {
			try {
				await registerForEvent(eventRegistration);
				toast({
					title: "Success",
					description: "User registered for event",
				});
			} catch (error) {
				toast({
					title: "Error",
					description: error instanceof Error ? error.message : "Failed to register user",
					variant: "destructive",
				});
			}
		});
	}, [selectedUserId, selectedEventId, latestEvent]);

	return (
		<div className="lg:grid lg:grid-cols-2 lg:gap-8">
			{/* Column 1: User List */}
			<div className="hidden lg:block">
				<div className="overflow-y-auto max-h-[600px] border rounded-lg">
					<div className="divide-y">
						<button
							type="button"
							onClick={() => setSelectedUserId("new-user")}
							className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${
								selectedUserId === "new-user" ? "bg-gray-100" : ""
							}`}
						>
							+ New User
						</button>
						{users?.map((user) => (
							<button
								type="button"
								key={user.id}
								onClick={() => setSelectedUserId(user.id)}
								className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${
									selectedUserId === user.id ? "bg-gray-100" : ""
								}`}
							>
								{user.first_name} {user.last_name}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Column 2: ComboBox (mobile) and QR Code */}
			<div className="space-y-6">
				<div className="lg:hidden">
					<ComboBox
						options={userOptions}
						value={selectedUserId}
						onChange={setSelectedUserId}
						placeholder="Select user..."
						searchPlaceholder="Search users..."
						emptyText="No users found"
					/>
				</div>

				{selectedUserId && (
					<div className="flex flex-col items-center space-y-4">
						{selectedUser && userRegistered(selectedUser) ? (
							<>
								<AnimatedTick />
								<img src={generateQrCode() ?? ""} alt="QR Code" />
								{process.env.NODE_ENV === "development" && (
									<p className="text-sm text-gray-500">{qrCodeUrl}</p>
								)}
							</>
						) : (
							<>
								<img src={generateQrCode() ?? ""} alt="QR Code" />
								<a href={qrCodeUrl} className="text-sm text-gray-500">
									{qrCodeUrl}
								</a>
							</>
						)}
					</div>
				)}

				{selectedUserId && (
					<div className="space-y-4">
						<ComboBox
							options={events?.map(event => ({
								value: event.id,
								label: `${event.name} (${new Date(event.start_time).toLocaleDateString()})`
							})) ?? []}
							value={selectedEventId}
							onChange={setSelectedEventId}
							placeholder="Select event..."
							searchPlaceholder="Search events..."
							emptyText="No events found"
						/>
						
						<Button 
							className="w-full"
							onClick={handleRegister}
							disabled={isPending || !selectedEventId || selectedUserId === "new-user"}
						>
							Register for Event
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
