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
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { isToday } from "date-fns";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter, useSearchParams } from "next/navigation";

function processPlayers(
	players: (User & {
		matches: Match[];
	})[],
	userId: string,
	waitingPlayerIds: Set<string>,
) {
	const playersInMatch = players.filter((player) =>
		player.matches?.some((match) => !match.winner),
	);
	return players.map((player) => {
		const inMatch = playersInMatch.some((p) => p.id === player.id);
		const currentMatch = playersInMatch
			.find((p) => p.id === player.id)
			?.matches.find((m) => !m.winner);
		const matchTable = currentMatch?.table_number;
		const isUmpiring = currentMatch?.umpire === player.id;

		return {
			...player,
			inMatch: inMatch && !isUmpiring,
			isUmpiring,
			matchTable,
			isResting: !waitingPlayerIds.has(player.id) && !inMatch && !isUmpiring,
		};
	});
}

function getPlayerStats(
	currentPlayer: User & { matches: Match[] },
	againstPlayerId: string,
) {
	const matchesAgainst = currentPlayer.matches.filter(
		(match) =>
			(match.player_1 === againstPlayerId ||
				match.player_2 === againstPlayerId) &&
			isToday(new Date(match.created_at)),
	);

	const wins = matchesAgainst.filter(
		(match) => match.winner === currentPlayer.id,
	).length;
	const losses = matchesAgainst.filter(
		(match) => match.winner === againstPlayerId,
	).length;

	return {
		todayMatches: matchesAgainst.length,
		todayWins: wins,
		todayLosses: losses,
		overallWins: currentPlayer.wins,
		overallLosses: currentPlayer.losses,
		overallPlayed: currentPlayer.matches_played,
	};
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
	const router = useRouter();
	const searchParams = useSearchParams();

	const { user } = useUser();
	const userId = searchParams.get("overrideUser") ?? user?.id;
	const currentUser = players?.find((p) => p.id === userId);

	if (!userId) {
		return "loading...";
	}

	const unplayedPlayers =
		players && waitingPlayerIds
			? processPlayers(players, userId, waitingPlayerIds)
			: [];

	return (
		<div className="flex flex-col items-center justify-center p-4 space-y-6">
			<div className="text-center space-y-2">
				<h2 className="text-2xl font-semibold">Welcome to {event?.name}</h2>
				<p className="text-gray-600">
					You're logged in as {currentUser?.first_name} {currentUser?.last_name}
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
								toast({
									title: "You're no longer waiting to play",
									description:
										"You'll be notified when you're assigned to play or umpire a match.",
								});
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
							toast({
								title: "Error updating player status",
								description: "Please try again later",
								variant: "destructive",
							});
						} finally {
							setLoading(false);
						}
					}}
				>
					{waitingPlayerIds?.has(userId) ? "Take a Break" : "Ready to Play"}
				</Button>
			</div>
			<div className="w-full max-w-md">
				<h3 className="text-xl font-semibold mb-4">Players</h3>
				<div className="space-y-2">
					{unplayedPlayers.map((player) => (
						<Popover key={player.id}>
							<PopoverTrigger asChild>
								<div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
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
										{(player.inMatch || player.isResting) && (
											<span
												className={cn(
													"ml-2 text-sm",
													player.inMatch
														? "text-yellow-600"
														: player.isUmpiring
															? "text-blue-600"
															: "text-gray-600",
												)}
											>
												{player.inMatch
													? `(Playing at Table ${player.matchTable})`
													: player.isUmpiring
														? `(Umpiring at Table ${player.matchTable})`
														: "(Resting)"}
											</span>
										)}
									</span>
								</div>
							</PopoverTrigger>
							<PopoverContent className="w-64">
								{userId && (
									<div className="space-y-2">
										<h4 className="font-semibold">
											{player.first_name} {player.last_name}
										</h4>
										{(() => {
											if (!players) return null;
											const currentPlayer = players.find(
												(p) => p.id === userId,
											);
											if (!currentPlayer) return null;
											const stats = getPlayerStats(currentPlayer, player.id);
											return (
												<>
													{process.env.NODE_ENV === "development" &&
														userId !== player.id && (
															<button
																className="text-blue-500 text-sm"
																onClick={() => {
																	router.push(
																		`/events/${eventId}/active?overrideUser=${player.id}`,
																	);
																}}
																type="button"
															>
																Impersonate
															</button>
														)}
													<div className="space-y-4">
														<div className="space-y-2">
															<h5 className="text-sm font-medium text-gray-500">
																Matches Today
															</h5>
															<p>Played: {stats.todayMatches}</p>
															<p className="text-green-600">
																Wins: {stats.todayWins}
															</p>
															<p className="text-red-600">
																Losses: {stats.todayLosses}
															</p>
														</div>
														<div className="space-y-2">
															<h5 className="text-sm font-medium text-gray-500">
																Overall Stats
															</h5>
															<p>Played: {stats.overallPlayed}</p>
															<p className="text-green-600">
																Wins: {stats.overallWins}
															</p>
															<p className="text-red-600">
																Losses: {stats.overallLosses}
															</p>
															{stats.overallPlayed > 0 && (
																<p className="text-gray-600">
																	Win Rate:{" "}
																	{Math.round(
																		(stats.overallWins / stats.overallPlayed) *
																			100,
																	)}
																	%
																</p>
															)}
														</div>
													</div>
												</>
											);
										})()}
									</div>
								)}
							</PopoverContent>
						</Popover>
					))}
				</div>
			</div>

			<div className="w-full max-w-md flex justify-center">
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="outline">View Current Standings</Button>
					</DialogTrigger>
					<DialogContent className="max-w-3xl">
						<DialogHeader>
							<DialogTitle>Current Standings</DialogTitle>
						</DialogHeader>
						<Standings
							players={players ?? []}
							matches={
								players
									?.flatMap((p) => p.matches)
									.filter((m) => isToday(new Date(m.created_at))) ?? []
							}
						/>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
