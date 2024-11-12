import { PlayerIcon } from "@/components/svgs/PlayerIcons";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import type { TournamentMatch } from "@/lib/tournamentManager/hooks/usePlayerTournament";
import {
	tournamentService,
	useTournament,
} from "@/lib/tournamentManager/hooks/useTournament";
import { client } from "@/lib/triplit";
import { X } from "lucide-react";

interface PendingMatchPlayerProps {
	match?: TournamentMatch | null;
	userId: string;
}

export function PendingMatchPlayer({ userId, match }: PendingMatchPlayerProps) {
	if (!match) return <div>No match</div>;
	const removeUmpireAction = useAsyncAction({
		actionName: "Remove umpire",
	});
	const players = match?.players?.filter(Boolean);
	const opponent = players?.find((p) => p.id !== userId);
	const me = players?.find((p) => p.id === userId);
	const initialConfirmAction = useAsyncAction({
		actionName: "Initial match confirmation",
	});
	if (!match) return null;
	const hasConfirmedInitialMatch = match.playersConfirmed?.has(userId);
	const bothPlayersConfirmed = match.playersConfirmed?.size === 2;
	const umpireConfirmed = match.umpireConfirmed;

	return (
		<div className="p-2 flex flex-col gap-4 items-center justify-center h-full">
			<div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 w-full max-w-md shadow-lg">
				{me && opponent && (
					<div className="flex items-center justify-between mb-4">
						<PlayerIcon gender={me.gender} className="w-16 h-16" />
						<PlayerIcon
							gender={opponent.gender}
							className="w-16 h-16 -scale-x-100"
						/>
					</div>
				)}
				<h2 className="text-2xl font-bold mb-4 text-center">
					Your Match is Ready
				</h2>
				<div className="text-center mb-6">
					<div className="text-xl font-semibold bg-yellow-100 rounded-lg py-2 px-4 inline-block">
						Table {match.table_number}
					</div>
				</div>
				<div className="text-center mb-6">
					<div className="text-xl font-semibold bg-green-100 rounded-lg py-2 px-4 inline-block">
						Best Of {match.best_of}
					</div>
				</div>

				<div className="mt-2">
					<p className="font-semibold mb-2">Your Opponent:</p>
					{opponent && (
						<div className="flex items-center gap-2 mb-2 bg-white rounded-lg p-3 border border-yellow-200">
							{opponent.profile_image_url && (
								<img
									src={opponent.profile_image_url}
									alt=""
									className="w-8 h-8 rounded-full"
								/>
							)}
							<span className="font-medium">
								{opponent.first_name} {opponent.last_name}
							</span>
						</div>
					)}
				</div>

				<div className="flex items-center justify-between">
					<p className="font-semibold">Umpire:</p>
					{!umpireConfirmed && (
						<button
							type="button"
							onClick={() => {
								window.confirm(
									"Are you sure you want to remove the umpire? This will cancel the match.",
								) &&
									removeUmpireAction.executeAction(async () => {
										if (!match.id) return;
										void tournamentService.removeMatchUmpire(match.id);
									});
							}}
							className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
							disabled={removeUmpireAction.isLoading}
						>
							<X className="w-4 h-4" />
							Remove umpire
						</button>
					)}
				</div>
				{match.umpire && (
					<div className="mt-4">
						<div className="flex items-center gap-2 mb-2 bg-white rounded-lg p-3 border border-yellow-200">
							{match.umpire.profile_image_url && (
								<img
									src={match.umpire.profile_image_url}
									alt=""
									className="w-8 h-8 rounded-full"
								/>
							)}
							<span className="font-medium">
								{match.umpire.first_name} {match.umpire.last_name}
							</span>
							<span className="text-sm text-gray-500">
								{umpireConfirmed ? "(Confirmed)" : "(Pending)"}
							</span>
						</div>
					</div>
				)}

				<div className="mt-4 text-center text-gray-700">
					{bothPlayersConfirmed ? (
						<p>Waiting for umpire to start the match...</p>
					) : hasConfirmedInitialMatch ? (
						<p>Waiting for other player to confirm...</p>
					) : (
						<p>
							Feel free to warm up for a couple of minutes and confirm when
							ready
						</p>
					)}
				</div>

				{!hasConfirmedInitialMatch && (
					<Button
						loading={initialConfirmAction.isLoading}
						disabled={!match.id}
						onClick={() => {
							initialConfirmAction.executeAction(async () => {
								if (!match.id) return;
								void tournamentService.matchConfirmation.confirmInitialMatch(
									match.id,
									userId,
								);
							});
						}}
						className="w-full text-lg py-6 mt-6"
					>
						I'm Ready, Let's Play!
					</Button>
				)}
			</div>
		</div>
	);
}
