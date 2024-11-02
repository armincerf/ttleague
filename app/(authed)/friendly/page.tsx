import PageLayout from "@/components/PageLayout";
import { httpClient } from "@/lib/triplitServerClient";
import UsersList from "@/components/UsersList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import WIPAlertBanner from "@/components/WIPAlertBanner";

const getUsers = async () => {
	const query = httpClient
		.query("users")
		.order("first_name", "ASC")
		.limit(25)
		.build();

	return httpClient.fetch(query);
};

export const revalidate = 60;

export default async function FriendlyPage() {
	const users = await getUsers();

	return (
		<PageLayout>
			<WIPAlertBanner />
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Challenge Players</h1>
				<Button asChild>
					<Link href="/find-a-table">Find a Table</Link>
				</Button>
			</div>
			<Button asChild>
				<Link href="/scoreboard">Create a Quick Match</Link>
			</Button>
			<UsersList users={users} />
		</PageLayout>
	);
}
