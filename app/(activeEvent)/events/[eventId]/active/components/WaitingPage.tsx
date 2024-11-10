import { client } from "@/lib/triplit";
import { useQuery, useQueryOne } from "@triplit/react";
import { Button } from "@/components/ui/button";
import { tournamentService } from "@/lib/tournamentManager/hooks/useTournament";
import { useUser } from "@/lib/hooks/useUser";
import type { User, Match } from "@/triplit/schema";
import { useEffect, useState } from "react";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import {
	AutoMatchScoreCard,
	MatchScoreCard,
} from "@/components/MatchScoreCard";
import { TodayMatches } from "@/components/TodayMatches";

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
	return players
		.filter((player) => player.id !== userId)
		.map((player) => {
			const inMatch = playersInMatch.some((p) => p.id === player.id);
			const currentMatch = playersInMatch
				.find((p) => p.id === player.id)
				?.matches.find((m) => !m.winner);
			const matchTable = currentMatch?.table_number;
			const isUmpiring = currentMatch?.umpire === player.id;

			const score = currentMatch
				? {
						playerScore:
							currentMatch.player_1 === player.id
								? (currentMatch.player_1_score ?? 0)
								: (currentMatch.player_2_score ?? 0),
						opponentScore:
							currentMatch.player_1 === player.id
								? (currentMatch.player_2_score ?? 0)
								: (currentMatch.player_1_score ?? 0),
					}
				: undefined;

			return {
				...player,
				inMatch: inMatch && !isUmpiring,
				isUmpiring,
				matchTable,
				score,
				currentMatch,
				isResting: !waitingPlayerIds.has(player.id) && !inMatch && !isUmpiring,
			};
		});
}

function getPlayerStats(
	currentPlayer: User & { matches: Match[] },
	againstPlayer: User & { matches: Match[] },
) {
	const matchesAgainst = currentPlayer.matches.filter(
		(match) =>
			(match.player_1 === againstPlayer.id ||
				match.player_2 === againstPlayer.id) &&
			isToday(new Date(match.created_at)),
	);

	const wins = matchesAgainst.filter(
		(match) => match.winner === currentPlayer.id,
	).length;
	const losses = matchesAgainst.filter(
		(match) => match.winner === againstPlayer.id,
	).length;

	const todayMatches = againstPlayer.matches.filter((match) =>
		isToday(new Date(match.created_at)),
	);
	const todayWins = todayMatches.filter(
		(match) => match.winner === againstPlayer.id,
	).length;
	const todayLosses = todayMatches.filter(
		(match) => match.winner && match.winner !== againstPlayer.id,
	).length;

	return {
		h2hMatches: matchesAgainst.length,
		h2hWins: wins,
		h2hLosses: losses,
		todayMatches: todayMatches.length,
		todayWins: todayWins,
		todayLosses: todayLosses,
		overallWins: againstPlayer.wins,
		overallLosses: againstPlayer.losses,
		overallPlayed: againstPlayer.matches_played,
	};
}

function HeaderTooltip({
	content,
	children,
}: { content: string; children: React.ReactNode }) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent>
					<p>{content}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
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
	const waiting = waitingPlayerIds?.has(userId ?? "");
	useEffect(() => {
		if (!waiting) {
			return;
		}
		const interval = setInterval(() => {
			const randomDelay = Math.floor(Math.random() * (15000 - 5000) + 5000);
			setTimeout(() => {
				tournamentService.generateNextMatch({ tournamentId, silent: true });
			}, randomDelay);
		}, 15000);

		return () => {
			clearInterval(interval);
		};
	}, [tournamentId, waiting]);

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
					waiting
						? "bg-yellow-50 border-yellow-200"
						: "bg-gray-50 border-gray-200"
				}`}
			>
				{waiting ? (
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
						waiting
							? "border-yellow-500 text-yellow-700 hover:bg-yellow-50"
							: "border-green-500 text-green-700 hover:bg-green-50"
					}
					loading={loading}
					onClick={async () => {
						setLoading(true);
						try {
							if (waiting) {
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
					{waiting ? "Take a Break" : "Ready to Play"}
				</Button>
			</div>
			<div className="w-full max-w-md">
				<h3 className="text-xl font-semibold mb-4">Players</h3>
				<div className="space-y-2">
					{unplayedPlayers.map((player) => (
						<Popover key={player.id}>
							<PopoverTrigger asChild>
								<div
									className={cn(
										"flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer",
										{
											"bg-yellow-50 border-yellow-200":
												player.inMatch || player.isUmpiring,
											"bg-gray-50 border-gray-200": !(
												player.inMatch || player.isUmpiring
											),
											"bg-green-50 border-green-200":
												!player.inMatch &&
												!player.isUmpiring &&
												!player.isResting,
											"opacity-70": player.isResting,
										},
									)}
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
										{(player.inMatch ||
											player.isResting ||
											player.isUmpiring) && (
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
													? `(Table ${player.matchTable})`
													: player.isUmpiring
														? `(Umpiring at Table ${player.matchTable})`
														: "(Resting)"}
											</span>
										)}
										{player.inMatch && !player.isUmpiring && player.score && (
											<span className="pl-2 text-bold underline">
												{player.score.playerScore} -{" "}
												{player.score.opponentScore}
											</span>
										)}
									</span>
								</div>
							</PopoverTrigger>
							<PopoverContent className="w-full">
								{player.inMatch && player.currentMatch && (
									<AutoMatchScoreCard
										matchId={player.currentMatch.id}
										playerOneId={player.id}
									/>
								)}
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
											const stats = getPlayerStats(currentPlayer, player);
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
													<div className="space-y-3">
														<div className="grid grid-cols-3 divide-x divide-gray-200">
															<div className="px-4 first:pl-0 last:pr-0">
																<HeaderTooltip
																	content={`Head to head record against ${player.first_name} ${player.last_name}`}
																>
																	<h5 className="font-medium text-gray-500 mb-1 border-b border-gray-200 pb-1 cursor-help">
																		H2H
																	</h5>
																</HeaderTooltip>
																<div className="grid grid-cols-2 gap-2">
																	<div>
																		<span className="text-gray-500 text-xs">
																			W
																		</span>
																		<div className="text-green-600 text-lg font-semibold">
																			{stats.h2hWins}
																		</div>
																	</div>
																	<div>
																		<span className="text-gray-500 text-xs">
																			L
																		</span>
																		<div className="text-red-600 text-lg font-semibold">
																			{stats.h2hLosses}
																		</div>
																	</div>
																</div>
															</div>
															<div className="px-4 first:pl-0 last:pr-0">
																<HeaderTooltip
																	content={`${player?.first_name} ${player?.last_name}'s total matches won and lost today`}
																>
																	<h5 className="font-medium text-gray-500 mb-1 border-b border-gray-200 pb-1 cursor-help">
																		Today
																	</h5>
																</HeaderTooltip>
																<div className="grid grid-cols-2 gap-2">
																	<div>
																		<span className="text-gray-500 text-xs">
																			W
																		</span>
																		<div className="text-green-600 text-lg font-semibold">
																			{stats.todayWins}
																		</div>
																	</div>
																	<div>
																		<span className="text-gray-500 text-xs">
																			L
																		</span>
																		<div className="text-red-600 text-lg font-semibold">
																			{stats.todayLosses}
																		</div>
																	</div>
																</div>
															</div>
															<div className="px-4 first:pl-0 last:pr-0">
																<HeaderTooltip
																	content={`${player?.first_name} ${player?.last_name}'s all-time record`}
																>
																	<h5 className="font-medium text-gray-500 mb-1 border-b border-gray-200 pb-1 cursor-help">
																		Overall
																	</h5>
																</HeaderTooltip>
																<div className="grid grid-cols-2 gap-2">
																	<div>
																		<span className="text-gray-500 text-xs">
																			W
																		</span>
																		<div className="text-green-600 text-lg font-semibold">
																			{stats.overallWins}
																		</div>
																	</div>
																	<div>
																		<span className="text-gray-500 text-xs">
																			L
																		</span>
																		<div className="text-red-600 text-lg font-semibold">
																			{stats.overallLosses}
																		</div>
																	</div>
																</div>
																{stats.overallPlayed > 0 && (
																	<div className="text-gray-600 text-xs mt-1">
																		(
																		{Math.round(
																			(stats.overallWins /
																				stats.overallPlayed) *
																				100,
																		)}
																		%)
																	</div>
																)}
															</div>
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

			<div className="w-full max-w-md flex justify-center gap-2">
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

				<Dialog>
					<DialogTrigger asChild>
						<Button variant="outline">Today's Matches</Button>
					</DialogTrigger>
					<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Today's Matches</DialogTitle>
						</DialogHeader>
						<TodayMatches />
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
