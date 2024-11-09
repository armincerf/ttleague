import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import type { TournamentMatch } from "@/lib/tournamentManager/hooks/usePlayerTournament";
import {
	tournamentService,
	useTournament,
} from "@/lib/tournamentManager/hooks/useTournament";

interface PendingMatchPlayerProps {
	match?: TournamentMatch | null;
	userId: string;
}

export function PendingMatchPlayer({ userId, match }: PendingMatchPlayerProps) {
	const players = match?.players?.filter(Boolean);
	const opponent = players?.find((p) => p.id !== userId);
	const initialConfirmAction = useAsyncAction({
		actionName: "Initial match confirmation",
	});
	if (!match) return null;
	const hasConfirmedInitialMatch = match.playersConfirmed?.has(userId);
	const bothPlayersConfirmed = match.playersConfirmed?.size === 2;
	const umpireConfirmed = match.umpireConfirmed;

	return (
		<div className="p-4 flex flex-col gap-4 items-center">
			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<h2 className="text-lg font-semibold mb-2">Your Match is Ready</h2>
				<p>Please proceed to Table {match.table_number}</p>
				<div className="mt-2 flex items-center gap-2 border rounded-md p-2 bg-white border-gray-200 pb-2">
					<p>Your Opponent:</p>
					{opponent?.profile_image_url && (
						<img
							src={opponent.profile_image_url}
							alt=""
							className="w-8 h-8 rounded-full"
						/>
					)}
					<span>
						{opponent?.first_name} {opponent?.last_name}
					</span>
				</div>
				{bothPlayersConfirmed ? (
					<p className="mt-2">Waiting for umpire to start the match...</p>
				) : hasConfirmedInitialMatch ? (
					<p className="mt-2">Waiting for other player to confirm...</p>
				) : (
					<p className="mt-2">
						Feel free to warm up for a couple of minutes and hit the button
						below whenever you're ready to start
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
					className="mt-4"
				>
					I'm Ready, Let's Play!
				</Button>
			)}
		</div>
	);
}
