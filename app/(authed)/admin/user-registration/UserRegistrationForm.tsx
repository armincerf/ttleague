"use client";

import { useQuery, useQueryOne } from "@triplit/react";
import { client } from "@/lib/triplit";
import { ComboBox } from "../manual-match-entry/components/ComboBox";
import { qrcodegen } from "@/lib/qrcodegen";
import { useState } from "react";
import { AnimatedTick } from "@/components/AnimatedTick";
import { User } from "@/triplit/schema";

export function UserRegistrationForm() {
	const [selectedUserId, setSelectedUserId] = useState<string>("");
	const { result: latestEvent } = useQueryOne(
		client,
		client.query("events").select(["id", "name"]).order("start_time", "DESC"),
	);
	const { results: users } = useQuery(
		client,
		client
			.query("users")
			.select(["id", "first_name", "last_name"])
			.include("events", (rel) => rel("events").select(["event_id"]).build()),
	);

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

	// Add a new function to generate the URL based on registration status
	const getQrCodeUrl = (userId: string) => {
		if (userId === "new-user") {
			return `${window.location.origin}/sign-up`;
		}
		const baseUrl = `${window.location.origin}/events/${latestEvent?.id}/active?overrideUser=${userId}`;
		const isRegistered = selectedUser && userRegistered(selectedUser);
		return isRegistered ? baseUrl : `${baseUrl}&signupRequested=true`;
	};

	// Update the qrCodeUrl to use the new function
	const qrCodeUrl = selectedUserId ? getQrCodeUrl(selectedUserId) : "";

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

	// Find the selected user object
	const selectedUser = users?.find((user) => user.id === selectedUserId);

	return (
		<div className="space-y-6">
			<ComboBox
				options={userOptions}
				value={selectedUserId}
				onChange={setSelectedUserId}
				placeholder="Select user..."
				searchPlaceholder="Search users..."
				emptyText="No users found"
			/>

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
							{process.env.NODE_ENV === "development" && (
								<p className="text-sm text-gray-500">{qrCodeUrl}</p>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
}
