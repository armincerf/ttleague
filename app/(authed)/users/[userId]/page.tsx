import { notFound } from "next/navigation";
import { httpClient } from "@/lib/triplitServerClient";
import { fetchUsers } from "@/lib/actions/users";
import { EditUserModal } from "./EditUserModal";
import { formatDate } from "date-fns";
import type { MatchScore } from "@/components/MatchScoreCard";
import { or } from "@triplit/client";
import type { User } from "@/triplit/schema";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import MatchHistoryTable from "@/components/MatchHistoryTable";

export type Match = {
	id: string;
	date: Date;
	opponent: User;
	player: User;
	scores: MatchScore[];
	bestOf: number;
	result: "win" | "loss";
	ratingChange: number;
	table?: string;
	umpire?: User | null;
	isManuallyCreated?: boolean;
};

async function fetchUser(userId: string) {
	const user = await httpClient.fetchById("users", userId);
	if (!user) {
		console.error("User not found", userId);
		notFound();
	}
	return user;
}

async function fetchUserMatches(userId: string): Promise<Match[]> {
	const matches = await httpClient.fetch(
		httpClient
			.query("matches")
			.where([
				or([
					["player1.id", "=", userId],
					["player2.id", "=", userId],
				]),
			])
			.include("player1")
			.include("player2")
			.include("umpireUser")
			.include("games")
			.order("created_at", "DESC")
			.build(),
	);

	// Calculate actual stats from matches
	const stats = matches.reduce(
		(acc, match) => {
			const isWinner = match.winner === userId;
			return {
				matchesPlayed: acc.matchesPlayed + 1,
				wins: acc.wins + (isWinner ? 1 : 0),
				losses: acc.losses + (isWinner ? 0 : 1),
			};
		},
		{
			matchesPlayed: 0,
			wins: 0,
			losses: 0,
		},
	);

	// Compare and update if different
	const user = await httpClient.fetchById("users", userId);
	if (
		user &&
		(user.matches_played !== stats.matchesPlayed ||
			user.wins !== stats.wins ||
			user.losses !== stats.losses)
	) {
		await httpClient.update("users", userId, (user) => {
			user.matches_played = stats.matchesPlayed;
			user.wins = stats.wins;
			user.losses = stats.losses;
		});
		console.warn("Updated user stats due to mismatch:", {
			old: user,
			new: stats,
		});
	}

	return matches
		?.map((match) => {
			const isPlayer1 = match.player_1 === userId;
			const opponent = isPlayer1 ? match.player2 : match.player1;
			const player = isPlayer1 ? match.player1 : match.player2;
			const matchScores = match.games.map((game) => ({
				player1Points: isPlayer1 ? game.player_1_score : game.player_2_score,
				player2Points: isPlayer1 ? game.player_2_score : game.player_1_score,
				isValid: true,
				startedAt: new Date(game.created_at),
				completedAt: game.completed_at
					? new Date(game.completed_at)
					: undefined,
			})) satisfies MatchScore[];
			if (matchScores.length === 0 || !player || !opponent) return null;

			return {
				id: match.id,
				date: new Date(match.created_at),
				opponent,
				player,
				scores: matchScores,
				bestOf: match.best_of,
				result: match.winner === userId ? "win" : "loss",
				ratingChange: match.ranking_score_delta,
				table: match.table_number.toString(),
				umpire: match.umpireUser,
				isManuallyCreated: !!match.manually_created,
			} as const;
		})
		.filter(Boolean);
}

// Next.js will invalidate the cache when a request comes in, at most once every 60 seconds.
export const revalidate = 60;

export const dynamicParams = true;

export async function generateStaticParams() {
	const users = await fetchUsers();
	return users.map((user) => ({ userId: user.id }));
}

interface UserPageProps {
	params: Promise<{ userId: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
	try {
		const { userId } = await params;
		if (!userId) notFound();

		const [user, matches] = await Promise.all([
			fetchUser(userId),
			fetchUserMatches(userId),
		]);

		function formatRubber(rubber: string): string {
			return rubber.replace("_", " ").trim();
		}

		return (
			<div className="relative min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-white p-8">
				<EditUserModal user={user} />
				<div className="max-w-4xl mx-auto space-y-8">
					<div className="relative bg-white/50 dark:bg-slate-800/50 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
						<div className="grid lg:grid-cols-[200px_1fr] gap-8">
							<div className="space-y-6">
								<div className="block md:hidden">
									<h1 className="text-4xl font-bold mb-2">
										{user.first_name} {user.last_name}
									</h1>
									<p>User since {formatDate(user.created_at, "MMMM yyyy")}</p>
								</div>
								<div className="relative group">
									<Image
										src={user.profile_image_url ?? "/default-avatar.png"}
										alt={`${user.first_name} ${user.last_name}`}
										width={128}
										height={128}
										className="w-32 mx-auto aspect-square object-cover rounded-xl shadow-lg"
									/>
								</div>

								<div className="bg-slate-200/50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
									<h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
										Stats
									</h2>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-slate-600 dark:text-slate-400">
												Matches
											</p>
											<p className="text-2xl font-bold">
												{user.matches_played}
											</p>
										</div>
										<div>
											<p className="text-slate-600 dark:text-slate-400">
												Rating
											</p>
											<p className="text-2xl font-bold text-emerald-400">
												{user.rating}
											</p>
										</div>
										<div>
											<p className="text-slate-600 dark:text-slate-400">Wins</p>
											<p className="text-2xl font-bold text-green-400">
												{user.wins}
											</p>
										</div>
										<div>
											<p className="text-slate-600 dark:text-slate-400">
												Losses
											</p>
											<p className="text-2xl font-bold text-red-400">
												{user.losses}
											</p>
										</div>
										{matches[0] && (
											<div className="col-span-2">
												<p className="text-slate-600 dark:text-slate-400">
													Last Match
												</p>
												<p className="text-lg font-bold">
													{formatDate(matches[0].date, "dd MMM yyyy")}
												</p>
											</div>
										)}
									</div>
								</div>
							</div>
							<div className="space-y-6">
								<div className="hidden md:block">
									<h1 className="text-4xl font-bold mb-2">
										{user.first_name} {user.last_name}
									</h1>
									<p>User since {formatDate(user.created_at, "MMMM yyyy")}</p>
								</div>
								{user.bio && (
									<div className="bg-slate-200/50 dark:bg-slate-700/50 rounded-lg p-4 mt-8">
										<h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
											Bio
										</h2>
										<div className="prose dark:prose-invert prose-slate max-w-none text-slate-800 dark:text-slate-200">
											<ReactMarkdown>{user.bio}</ReactMarkdown>
										</div>
									</div>
								)}

								<div className="bg-slate-200/50 dark:bg-slate-700/50 rounded-lg p-4">
									<h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">
										Playing Style
									</h2>
									{user.playStyle ? (
										<div className="grid sm:grid-cols-2 gap-4">
											<div>
												<p className="text-slate-600 dark:text-slate-400">
													Style
												</p>
												<p className="text-lg font-semibold">
													{user.playStyle}
												</p>
											</div>
											{user.forehandRubber && (
												<div>
													<p className="text-slate-600 dark:text-slate-400">
														Forehand Rubber
													</p>
													<p className="text-lg font-semibold">
														{formatRubber(user.forehandRubber)}
													</p>
												</div>
											)}
											{user.backhandRubber && (
												<div>
													<p className="text-slate-600 dark:text-slate-400">
														Backhand Rubber
													</p>
													<p className="text-lg font-semibold">
														{formatRubber(user.backhandRubber)}
													</p>
												</div>
											)}
										</div>
									) : (
										<p className="text-slate-600 dark:text-slate-400">
											No playing style set
										</p>
									)}
								</div>
							</div>
						</div>
					</div>

					<div className="relative bg-white/50 dark:bg-slate-800/50 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
						<h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">
							Match History
						</h2>
						<MatchHistoryTable
							matches={matches}
							currentUserId={userId}
							pageSize={20}
						/>
					</div>
				</div>
			</div>
		);
	} catch (error) {
		console.error("Error fetching user data:", error);
		notFound();
	}
}
