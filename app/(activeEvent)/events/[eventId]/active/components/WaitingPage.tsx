import { client } from "@/lib/triplit";
import { useQuery, useQueryOne } from "@triplit/react";
import { Button } from "@/components/ui/button";
import { tournamentService } from "@/lib/tournamentManager/hooks/useTournament";
import { useUser } from "@/lib/hooks/useUser";
import type { User, Match } from "@/triplit/schema";
import { useEffect, useState } from "react";
import { Scoreboard } from "@/components/tournamentManager/Scoreboard";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Standings } from "@/components/Standings";

function filterUnplayedPlayers(
	players: (User & {
		matches: Match[];
	})[],
	userId: string,
	waitingPlayerIds: Set<string>,
) {
	return players
		.filter((player) => {
			if (player.id === userId) return false;

			// Include players with no matches array or empty matches
			if (!player.matches?.length) return true;

			// Check if there's no match between current user and this player
			return !player.matches.some(
				(match) =>
					(match.player_1 === userId && match.player_2 === player.id) ||
					(match.player_2 === userId && match.player_1 === player.id),
			);
		})
		.map((player) => ({
			...player,
			isResting: !waitingPlayerIds.has(player.id),
		}));
}

export function WaitingPage({
	eventId,
	tournamentId,
	playerIds: waitingPlayerIds,
}: {
	eventId: string;
	tournamentId: string;
	playerIds: Set<string> | undefined;
}) {
	const [loading, setLoading] = useState(false);
	const { result: event } = useQueryOne(
		client,
		client.query("events").where("id", "=", eventId).select(["name"]),
	);
	const { results: players } = useQuery(
		client,
		client
			.query("users")
			.where(["events.event_id", "=", eventId])
			.include("matches"),
	);

	const { user } = useUser();
	const userId = user?.id;

	if (!userId) {
		return "loading...";
	}

	const unplayedPlayers =
		players && waitingPlayerIds
			? filterUnplayedPlayers(players, userId, waitingPlayerIds)
			: [];

	return (
		<div className="flex flex-col items-center justify-center p-4 space-y-6">
			<div className="text-center space-y-2">
				<h2 className="text-2xl font-semibold">Welcome to {event?.name}</h2>
				<p className="text-gray-600">
					You're logged in as {user?.firstName} {user?.lastName}
				</p>
			</div>

			<div
				className={`border rounded-lg p-4 max-w-md ${
					waitingPlayerIds?.has(userId)
						? "bg-yellow-50 border-yellow-200"
						: "bg-gray-50 border-gray-200"
				}`}
			>
				{waitingPlayerIds?.has(userId) ? (
					<>
						<h3 className="text-xl font-semibold mb-2 text-yellow-800">
							Waiting for Assignment
						</h3>
						<p className="text-yellow-700">
							You'll be notified when you're assigned to play or umpire a match.
							Feel free to take a break if you need one!
						</p>
					</>
				) : (
					<>
						<h3 className="text-xl font-semibold mb-2 text-gray-700">
							Taking a Break
						</h3>
						<p className="text-gray-600">
							You won't be assigned to any matches. Click the "Ready to Play"
							button below when you're ready to rejoin the rotation.
						</p>
					</>
				)}
			</div>

			<div className="flex gap-4">
				<Button
					variant="outline"
					className={
						waitingPlayerIds?.has(userId)
							? "border-yellow-500 text-yellow-700 hover:bg-yellow-50"
							: "border-green-500 text-green-700 hover:bg-green-50"
					}
					loading={loading}
					onClick={async () => {
						setLoading(true);
						try {
							if (waitingPlayerIds?.has(userId)) {
								await client.update(
									"active_tournaments",
									tournamentId,
									(tournament) => {
										tournament.player_ids.delete(userId);
									},
								);
							} else {
								await client.update(
									"active_tournaments",
									tournamentId,
									(tournament) => {
										tournament.player_ids.add(userId);
									},
								);
								await tournamentService.generateNextMatch({
									tournamentId,
									silent: true,
								});
							}
						} catch (error) {
							console.error("Error updating player status:", error);
						} finally {
							setLoading(false);
						}
					}}
				>
					{waitingPlayerIds?.has(userId) ? "Take a Break" : "Ready to Play"}
				</Button>
			</div>
			<div className="w-full max-w-md">
				<h3 className="text-xl font-semibold mb-4">
					Players You Haven't Played Yet
				</h3>
				<div className="space-y-2">
					{unplayedPlayers.map((player) => (
						<div
							key={player.id}
							className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
						>
							{player.profile_image_url ? (
								<img
									src={player.profile_image_url}
									alt={`${player.first_name}'s profile`}
									className="w-10 h-10 rounded-full object-cover"
								/>
							) : (
								<div className="w-10 h-10 rounded-full bg-gray-200" />
							)}
							<span>
								{player.first_name} {player.last_name}
								{player.isResting && (
									<span className="ml-2 text-sm text-yellow-600">
										(Inactive)
									</span>
								)}
							</span>
						</div>
					))}
				</div>
			</div>

			<div className="w-full max-w-md flex justify-center">
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="outline">View Tournament Standings</Button>
					</DialogTrigger>
					<DialogContent className="max-w-3xl">
						<DialogHeader>
							<DialogTitle>Tournament Standings</DialogTitle>
						</DialogHeader>
						<Standings
							players={players ?? []}
							matches={players?.flatMap((p) => p.matches) ?? []}
						/>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
