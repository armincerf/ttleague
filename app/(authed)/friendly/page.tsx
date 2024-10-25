import PageLayout from "@/components/PageLayout";
import { httpClient } from "@/lib/triplitServerClient";
import { unstable_cache } from "next/cache";
import UsersList from "@/components/UsersList";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const getUsers = unstable_cache(
	async () => {
		const query = httpClient
			.query("users")
			.order("first_name", "ASC")
			.limit(25)
			.build();

		return httpClient.fetch(query);
	},
	["friendly-users"],
	{
		revalidate: 60,
		tags: ["friendly-users"],
	},
);

export const revalidate = 60;

export default async function FriendlyPage() {
	const users = await getUsers();

	return (
		<PageLayout>
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Challenge Players</h1>
				<Button asChild>
					<Link href="/find-a-table">Find a Table</Link>
				</Button>
			</div>
			<UsersList users={users} />
		</PageLayout>
	);
}
