"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { client } from "@/lib/triplit";
import { useConnectionStatus, useQueryOne } from "@triplit/react";

function LeagueRegistrationButton({ leagueId }: { leagueId: string }) {
	const { userId } = useAuth();
	const router = useRouter();
	const [isRegistering, setIsRegistering] = useState(false);
	const connectionStatus = useConnectionStatus(client);
	const { result: myEvents, fetching } = useQueryOne(
		client,
		client
			.query("users")
			.where([
				["id", "=", userId || ""],
				["registered_league_ids", "has", leagueId],
			])
			.build(),
	);

	const handleRegister = async () => {
		if (!userId) return;

		setIsRegistering(true);
		try {
			const existing = await client.fetchById("users", userId);
			if (!existing) {
				console.error(
					"User not found",
					userId,
					await client.fetch(
						client.query("users").select(["email", "id"]).build(),
					),
				);
				throw new Error("User not found");
			}
			await client.update("users", userId, (user) => {
				user.registered_league_ids.add(leagueId);
			});
			router.refresh();
		} catch (error) {
			console.error("Failed to register for league:", error);
			// TODO: Add error handling, perhaps show a toast notification
		} finally {
			setIsRegistering(false);
		}
	};

	if (!userId) {
		return (
			<Button asChild className="w-full mb-8" size="lg">
				<Link
					href={`/sign-up?redirect=${encodeURIComponent(`/leagues/${leagueId}`)}`}
				>
					Sign In to Register
				</Link>
			</Button>
		);
	}

	const isRegistered = myEvents?.registered_league_ids.has(leagueId);
	if (isRegistered) {
		return (
			<Button className="w-full mb-8 bg-green-700" size="lg" disabled>
				You are registered for this league!
			</Button>
		);
	}

	return (
		<Button
			className="w-full mb-8"
			size="lg"
			onClick={handleRegister}
			disabled={isRegistering || connectionStatus !== "OPEN"}
		>
			{isRegistering ? "Registering..." : "Register for League"}
		</Button>
	);
}

export default LeagueRegistrationButton;
