
export interface UserPageProps {
	params: Promise<{ userId: string }>;
}

import MatchHistoryTable from "@/components/MatchHistoryTable";
import { format as formatDate } from "date-fns";
import Image from "next/image";
import { EditUserModal } from "./EditUserModal";
import { fetchUser, fetchUserMatches } from "./fetchers";
import { UserBio } from "./UserBio";

export default async function UserPage({ params }: UserPageProps) {
	const { userId } = await params;
	if (!userId) {
		return <div>User not found</div>;
	}

	const [user, matches] = await Promise.all([
		fetchUser(userId),
		fetchUserMatches(userId),
	]);

	function formatRubber(rubber: string): string {
		return rubber.replace("_", " ").trim();
	}
	if (!user) {
		return <div>User not found</div>;
	}
	if (!matches) {
		return <div>Matches not found</div>;
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
									className="w-32 mx-auto aspect-square object-cover rounded-xl shadow-lg" />
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
							<UserBio user={user} />


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
						pageSize={20} />
				</div>
			</div>
		</div>
	);
}
