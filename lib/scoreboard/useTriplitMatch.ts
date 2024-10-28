import { useQueryOne } from "@triplit/react";
import { client } from "@/lib/triplit";

export function useTriplitMatch(matchId: string) {
	const { result: match } = useQueryOne(
		client,
		client
			.query("matches")
			.where([["id", "=", matchId]])
			.include("player1")
			.include("player2")
			.include("games"),
	);

	return match;
}
