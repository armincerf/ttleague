import { UmpireIcon, UmpireMaleIcon } from "@/components/svgs/UmpireIcons";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { tournamentService } from "@/lib/tournamentManager/hooks/useTournament";
import { client } from "@/lib/triplit";
import { useQuery, useQueryOne } from "@triplit/react";

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
	const { result: me } = useQueryOne(
		client,
		client.query("users").select(["gender"]).where("id", "=", userId),
	);

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
