"use client";

import { useState } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { client } from "@/lib/triplit";
import { useConnectionStatus, useQueryOne } from "@triplit/react";
import { Skeleton } from "@/components/ui/skeleton";

function LeagueRegistrationButton({ leagueId }: { leagueId: string }) {
	const { user } = useUser();
	const userId = user?.id;
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
				await client.insert("users", {
					id: userId,
					table_tennis_england_id: "",
					email: user?.primaryEmailAddress?.emailAddress ?? "",
					first_name: user?.firstName ?? "",
					last_name: user?.lastName ?? "",
					rating: 0,
					matches_played: 0,
					wins: 0,
					losses: 0,
					no_shows: 0,
					registered_league_ids: new Set([leagueId]),
				});
			}
			await client.update("users", userId, (user) => {
				user.registered_league_ids.add(leagueId);
			});
		} catch (error) {
			console.error("Failed to register for league:", error);
			// TODO: Add error handling, perhaps show a toast notification
		} finally {
			setIsRegistering(false);
		}
	};

	if (fetching) {
		return <Skeleton className="w-full h-12 mb-8" />;
	}

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
		return null;
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
