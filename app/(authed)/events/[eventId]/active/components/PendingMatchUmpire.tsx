import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { tournamentService } from "@/lib/tournamentManager/hooks/useTournament";

interface PendingMatchUmpireProps {
	match: {
		id: string;
		players:
			| Array<
					| {
							id: string;
							profile_image_url: string | undefined;
							first_name: string;
							last_name: string;
					  }
					| undefined
			  >
			| undefined;
		table: number;
		playersConfirmed: Set<string>;
	};
	userId: string;
}

export function PendingMatchUmpire({ match, userId }: PendingMatchUmpireProps) {
	const bothPlayersConfirmed = match.playersConfirmed.size === 2;
	const initialConfirmAction = useAsyncAction({
		actionName: "Umpire - Start Match",
	});
	const players = match.players?.filter(Boolean);
	return (
		<div className="p-4 flex flex-col gap-4 items-center">
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<h2 className="text-lg font-semibold mb-2">Umpire Assignment</h2>
				<p>Please proceed to Table {match.table}</p>
				<div className="mt-2">
					<p>Players:</p>
					{players?.slice(0, 2).map((player) => (
						<div key={player.id} className="flex items-center gap-2">
							{player.profile_image_url && (
								<img
									src={player.profile_image_url}
									alt=""
									className="w-8 h-8 rounded-full"
								/>
							)}
							<span>
								{player.first_name} {player.last_name}
							</span>
							<span className="text-sm text-gray-500">
								{match.playersConfirmed.has(player.id)
									? "(Confirmed)"
									: "(Waiting for confirmation)"}
							</span>
						</div>
					))}
				</div>
			</div>
			<Button
				className="mt-4"
				loading={initialConfirmAction.isLoading}
				disabled={!bothPlayersConfirmed}
				onClick={() => {
					initialConfirmAction.executeAction(() =>
						tournamentService.matchConfirmation.confirmInitialMatchUmpire(
							match.id,
							userId,
						),
					);
				}}
			>
				{bothPlayersConfirmed ? "Start Match" : "Waiting for players..."}
			</Button>
		</div>
	);
}
