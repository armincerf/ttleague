import { notFound } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RecordScoreForm from "./RecordScoreForm";
import { fetchMatch, fetchMatches } from "@/lib/actions/matches";
import { fetchLeagues } from "@/lib/actions/leagues";
import { fetchEvents } from "@/lib/actions/events";

// Next.js will invalidate the cache when a request comes in, at most once every 60 seconds.
export const revalidate = 60;

export const dynamicParams = true;

export async function generateStaticParams() {
	const leagues = await fetchLeagues();
	const ids: { leagueId: string; eventId: string; matchId: string }[] = [];
	for (const league of leagues) {
		const events = await fetchEvents(league.id);
		for (const event of events) {
			const matches = await fetchMatches(event.id);
			for (const match of matches) {
				ids.push({
					leagueId: league.id,
					eventId: event.id,
					matchId: match.id,
				});
			}
		}
	}
	return ids;
}

export default async function MatchPage({
	params,
}: {
	params: Promise<{ matchId: string; leagueId: string; eventId: string }>;
}) {
	const { matchId } = await params;
	const match = await fetchMatch(matchId);
	if (
		!match ||
		!match.player1 ||
		!match.player2 ||
		!match.event ||
		!match.games
	) {
		notFound();
	}

	const currentScore = match.games.reduce(
		(acc, game) => {
			const isGameOver = !!game.final_score;
			if (isGameOver) {
				const isP1Win = game.player_1_score > game.player_2_score;
				return isP1Win ? [acc[0] + 1, acc[1]] : [acc[0], acc[1] + 1];
			}
			return acc;
		},
		[0, 0],
	);

	function padScore(score: string | null): string {
		if (!score) return "\u00A0\u00A0\u00A0-\u00A0\u00A0\u00A0";
		const [score1, score2] = score.split("-").map((s) => s.trim());
		return `${score1.padStart(2, "\u00A0")} - ${score2.padStart(2, "\u00A0")}`;
	}

	return (
		<PageLayout>
			<div className="max-w-2xl mx-auto pb-24">
				<h1 className="text-3xl font-bold mb-6">Table {match.table_number}</h1>

				<Card>
					<CardContent>
						<div className="flex flex-col  justify-between items-center mb-4 pt-2">
							<div className="flex items-center gap-2">
								<Avatar>
									<AvatarImage src={match.player1.profile_image_url} />
									<AvatarFallback>
										{match.player1.first_name[0]}
										{match.player1.last_name[0]}
									</AvatarFallback>
								</Avatar>
								<span>
									{match.player1.first_name} {match.player1.last_name} -{" "}
									{currentScore[0]}
								</span>
							</div>
							<span className="font-bold">vs</span>
							<div className="flex items-center gap-2">
								<Avatar>
									<AvatarImage src={match.player2.profile_image_url} />
									<AvatarFallback>
										{match.player2.first_name[0]}
										{match.player2.last_name[0]}
									</AvatarFallback>
								</Avatar>
								<span>
									{match.player2.first_name} {match.player2.last_name} -{" "}
									{currentScore[1]}
								</span>
							</div>
						</div>
						<ul>
							{match.games.map((game, idx) => {
								if (!game.final_score) return null;
								return (
									<li key={game.id}>
										<span className="font-semibold pr-2">Game {idx + 1}:</span>{" "}
										<span className="font-mono">
											{padScore(game.final_score)}
										</span>
									</li>
								);
							})}
						</ul>
					</CardContent>
				</Card>
				<RecordScoreForm match={match} />
			</div>
		</PageLayout>
	);
}
