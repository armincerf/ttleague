import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { client } from "@/lib/triplit";
import PageLayout from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RegistrationForm from "./RegistrationForm";
import ParticipantsTable from "./ParticipantsTable";
import { getDivision, leagueDivisionsSchema } from "@/lib/ratingSystem";

const sortedLeagueDivisions = leagueDivisionsSchema.options.reverse();

async function fetchEvent(eventId: string) {
	const event = await client.fetchOne(
		client
			.query("events")
			.where("id", "=", eventId)
			.include("club")
			.include("registrations")
			.build(),
	);
	if (!event) notFound();
	return event;
}

async function fetchUser(userId: string) {
	const user = await client.fetchById("users", userId);
	if (!user) notFound();
	const validatedDivision = getDivision(user.current_division);
	return {
		...user,
		current_division: validatedDivision,
	};
}

export default async function EventRegistrationPage({
	params,
}: {
	params: { leagueId: string; eventId: string };
}) {
	const { userId } = auth();
	if (!userId) notFound();

	const { eventId, leagueId } = params;
	const [event, user] = await Promise.all([
		fetchEvent(eventId),
		fetchUser(userId),
	]);

	const userDivisionIndex = sortedLeagueDivisions.indexOf(
		user.current_division,
	);
	const defaultMinLevel = Math.max(0, userDivisionIndex - 2);
	const defaultMaxLevel = Math.min(
		sortedLeagueDivisions.length - 1,
		userDivisionIndex + 2,
	);

	return (
		<PageLayout>
			<div className="max-w-4xl mx-auto pb-24">
				<h1 className="text-3xl font-bold mb-6">Register for {event.name}</h1>

				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Event Details</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Date: {new Date(event.start_time).toLocaleDateString()}</p>
						<p>Time: {new Date(event.start_time).toLocaleTimeString()}</p>
						<p>Location: {event.club?.name}</p>
					</CardContent>
				</Card>

				<RegistrationForm
					eventId={event.id}
					leagueId={leagueId}
					userId={userId}
					defaultMinLevel={sortedLeagueDivisions[defaultMinLevel]}
					defaultMaxLevel={sortedLeagueDivisions[defaultMaxLevel]}
				/>

				<Card className="mt-8">
					<CardHeader>
						<CardTitle>Registered Players In Your Selected Level</CardTitle>
					</CardHeader>
					<CardContent>
						<ParticipantsTable eventId={event.id} />
					</CardContent>
				</Card>
			</div>
		</PageLayout>
	);
}
