import { notFound } from "next/navigation";
import { httpClient } from "@/lib/triplitServerClient";
import { fetchUsers } from "@/lib/actions/users";
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

		return (
			<div className="p-4 max-w-md mx-auto">
				<img
					src={user.profile_image_url}
					alt={`${user.first_name} ${user.last_name}`}
					className="w-32 h-32 rounded-full mx-auto mb-4"
				/>
				<h1 className="text-2xl font-bold mb-4">
					{user.first_name} {user.last_name}
				</h1>
				<div className="space-y-2">
					<p>
						<span className="font-semibold">Email:</span> {user.email}
					</p>
					<p>
						<span className="font-semibold">Gender:</span> {user.gender}
					</p>
					<p>
						<span className="font-semibold">Matches Played:</span>{" "}
						{user.matches_played}
					</p>
					<p>
						<span className="font-semibold">Wins:</span> {user.wins}
					</p>
					<p>
						<span className="font-semibold">Losses:</span> {user.losses}
					</p>
					<p>
						<span className="font-semibold">Rating:</span> {user.rating}
					</p>
				</div>
			</div>
		);
	} catch (error) {
		console.error("Error fetching user data:", error);
		notFound();
	}
}