import { notFound } from "next/navigation";
import { httpClient } from "@/lib/triplitServerClient";
import { fetchUsers } from "@/lib/actions/users";
import { EditUserModal } from "./EditUserModal";
import { formatDate } from "date-fns";

async function fetchUser(userId: string) {
	const user = await httpClient.fetchById("users", userId);
	if (!user) {
		console.error("User not found", userId);
		notFound();
	}
	return user;
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

		const user = await fetchUser(userId);

		function formatRubber(rubber: string): string {
			return rubber.replace("_", " ").trim();
		}

		return (
			<div className="relative min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-white p-8">
				<EditUserModal user={user} />
				<div className="max-w-4xl mx-auto relative bg-white/50 dark:bg-slate-800/50 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
					<div className="grid md:grid-cols-[300px_1fr] gap-8">
						{/* Left Column - Profile Image & Stats */}
						<div className="space-y-6">
							<div className="relative group">
								<img
									src={user.profile_image_url ?? "/default-avatar.png"}
									alt={`${user.first_name} ${user.last_name}`}
									className="w-full aspect-square object-cover rounded-xl shadow-lg"
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
										<p className="text-2xl font-bold">{user.matches_played}</p>
									</div>
									<div>
										<p className="text-slate-600 dark:text-slate-400">Rating</p>
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
										<p className="text-slate-600 dark:text-slate-400">Losses</p>
										<p className="text-2xl font-bold text-red-400">
											{user.losses}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Right Column - User Info */}
						<div className="space-y-6">
							<div>
								<h1 className="text-4xl font-bold mb-2">
									{user.first_name} {user.last_name}
								</h1>
								<p>User since {formatDate(user.created_at, "MMMM yyyy")}</p>
							</div>

							{user.bio && (
								<div className="bg-slate-200/50 dark:bg-slate-700/50 rounded-lg p-4">
									<h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
										Bio
									</h2>
									<p className="text-slate-800 dark:text-slate-200">
										{user.bio}
									</p>
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
											<p className="text-lg font-semibold">{user.playStyle}</p>
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
			</div>
		);
	} catch (error) {
		console.error("Error fetching user data:", error);
		notFound();
	}
}
