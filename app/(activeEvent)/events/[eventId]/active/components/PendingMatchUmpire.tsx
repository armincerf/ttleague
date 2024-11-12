import { UmpireIcon } from "@/components/svgs/UmpireIcons";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { tournamentService } from "@/lib/tournamentManager/hooks/useTournament";
import { client } from "@/lib/triplit";
import { useQuery, useQueryOne } from "@triplit/react";
import { ChooseServer } from "./ChooseServer";
import { useState } from "react";
import type { TournamentMatch } from "@/lib/tournamentManager/hooks/usePlayerTournament";

interface PendingMatchUmpireProps {
	match: TournamentMatch | null;
	userId: string;
}

export function PendingMatchUmpire({ match, userId }: PendingMatchUmpireProps) {
	if (!match) return <div>No match</div>;
	const bothPlayersConfirmed = match.playersConfirmed.size === 2;
	const initialConfirmAction = useAsyncAction({
		actionName: "Umpire - Start Match",
	});
	const players = match.players?.filter(Boolean);
	const { result: me } = useQueryOne(
		client,
		client.query("users").select(["gender"]).where("id", "=", userId),
	);
	const [serverId, setServerId] = useState<string | null>(null);

	return (
		<div className="p-2 flex flex-col gap-4 items-center justify-center h-full">
			<div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 w-full max-w-md shadow-lg">
				<UmpireIcon gender={me?.gender} className="w-32 h-32 mx-auto mb-4" />
				<h2 className="text-2xl font-bold mb-4 text-center">
					Umpire Assignment
				</h2>
				<div className="text-center mb-6">
					<div className="text-xl font-semibold bg-blue-100 rounded-lg py-2 px-4 inline-block">
						Table {match.table}
					</div>
				</div>
				<div className="text-center mb-6">
					<div className="text-xl font-semibold bg-green-100 rounded-lg py-2 px-4 inline-block">
						Best Of {match.best_of}
					</div>
				</div>
				<div className="mt-2">
					<p className="font-semibold mb-2">Players:</p>
					{players?.slice(0, 2).map((player) => (
						<div key={player.id} className="flex items-center gap-2 mb-2">
							{player.profile_image_url && (
								<img
									src={player.profile_image_url}
									alt=""
									className="w-8 h-8 rounded-full"
								/>
							)}
							<span className="font-medium">
								{player.first_name} {player.last_name}
							</span>
							<span className="text-sm text-gray-500">
								{match.playersConfirmed.has(player.id)
									? "(Confirmed)"
									: "(Waiting for confirmation)"}
							</span>
						</div>
					))}
					{players?.[0] && players?.[1] && (
						<ChooseServer
							initialServerChosen={false}
							player1={players?.[0]}
							player2={players?.[1]}
							onServerChosen={(id) => setServerId(id)}
						/>
					)}
				</div>
				<Button
					className="w-full text-lg py-6 mt-6"
					loading={initialConfirmAction.isLoading}
					disabled={!bothPlayersConfirmed}
					onClick={() => {
						initialConfirmAction.executeAction(() =>
							tournamentService.matchConfirmation.confirmInitialMatchUmpire(
								match.id,
								userId,
								serverId ?? "",
							),
						);
					}}
				>
					{bothPlayersConfirmed ? "Start Match" : "Waiting for players..."}
				</Button>
			</div>
		</div>
	);
}
