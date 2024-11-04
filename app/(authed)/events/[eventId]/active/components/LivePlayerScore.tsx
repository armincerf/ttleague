import { useQuery, useQueryOne } from "@triplit/react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { client } from "@/lib/triplit";
import { cn } from "@/lib/utils";

type LivePlayerScoreProps = {
	matchId: string;
	userId: string;
	player: {
		scoreKey: "player_1_score" | "player_2_score";
		name: string;
		avatar?: string;
		id: string;
	};
};

export function LivePlayerScore({ matchId, player }: LivePlayerScoreProps) {
	const { results: games } = useQuery(
		client,
		client
			.query("games")
			.where([["match_id", "=", matchId]])
			.select(["sides_swapped", player.scoreKey, "winner"])
			.order("started_at", "DESC"),
	);
	const currentGame = games?.[0];

	const currentScore = currentGame?.[player.scoreKey] ?? 0;
	const gamesWon = games?.filter((game) => game.winner === player.id).length;
	const isP1 = player.scoreKey === "player_1_score";
	const swappedSides = !!currentGame?.sides_swapped;

	// left if p1, right if p2. swapped if swappedSides is true
	const side = (isP1 ? !swappedSides : swappedSides) ? "left" : "right";

	return (
		<div className="absolute top-0 left-0 w-full h-full z-[200] bg-white flex flex-col items-center justify-center overflow-hidden">
			{gamesWon !== undefined && (
				<div
					className={cn(
						"absolute top-2 text-red-500 font-bold text-xl",
						side === "left" ? "left-4" : "right-4",
					)}
				>
					{gamesWon}
				</div>
			)}
			<div
				className={cn(
					"absolute top-0 -mt-20 font-bold",
					currentScore < 10 ? "text-[60vh]" : "text-[40vh]",
				)}
			>
				{currentScore}
			</div>
			<div className="flex items-center gap-2 mt-4 absolute bottom-4">
				{player.avatar && (
					<Avatar>
						<AvatarImage src={player.avatar} alt={player.name} />
					</Avatar>
				)}
				<span className="text-lg font-medium">{player.name}</span>
			</div>
		</div>
	);
}
