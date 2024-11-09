import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ParticipantsTable from "./ParticipantsTable";
import RegistrationForm from "./RegistrationForm";
import { getDivision, leagueDivisionsSchema } from "@/lib/ratingSystem";
import { fetchEvent, fetchEvents } from "@/lib/actions/events";
import { fetchUser } from "@/lib/actions/users";
import { formatDate } from "date-fns";
const sortedLeagueDivisions = leagueDivisionsSchema.options.reverse();

function calculateLevels(
	user: NonNullable<Awaited<ReturnType<typeof fetchUser>>>,
) {
	const userDivisionIndex = sortedLeagueDivisions.indexOf(
		getDivision(user.current_division),
	);
	const defaultMin = user.default_min_opponent_level
		? sortedLeagueDivisions.indexOf(user.default_min_opponent_level)
		: Math.max(0, userDivisionIndex - 2);
	const defaultMax = user.default_max_opponent_level
		? sortedLeagueDivisions.indexOf(user.default_max_opponent_level)
		: Math.min(sortedLeagueDivisions.length - 1, userDivisionIndex + 1);

	return {
		defaultMinLevel: defaultMin,
		defaultMaxLevel: defaultMax,
	};
}
export default async function EventRegistrationPage({
	params,
}: {
	params: Promise<{ leagueId: string; eventId: string }>;
}) {
	const { userId } = await auth();
	if (!userId) notFound();

	const { eventId, leagueId } = await params;
	const [event, user] = await Promise.all([
		fetchEvent(eventId),
		fetchUser(userId),
	]);
	if (!event || !user) notFound();
	const { defaultMinLevel, defaultMaxLevel } = calculateLevels(user);

	return (
		<PageLayout>
			<div className="max-w-4xl mx-auto pb-24">
				<h1 className="text-3xl font-bold mb-6">Register for {event.name}</h1>

				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Event Details</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Date: {formatDate(event.start_time, "dd MMM")}</p>
						<p>Time: {formatDate(event.start_time, "h:mm a")}</p>
						<p>Location: {event.club?.name}</p>
					</CardContent>
				</Card>

				<RegistrationForm
					eventId={event.id}
					leagueId={leagueId}
					userId={userId}
					defaultMinLevel={defaultMinLevel}
					defaultMaxLevel={defaultMaxLevel}
				/>

				<Card className="mt-8">
					<CardHeader>
						<CardTitle>Registered Players In Your Selected Level</CardTitle>
					</CardHeader>
					<CardContent>
						<ParticipantsTable
							eventId={event.id}
							defaultMinLevel={defaultMinLevel}
							defaultMaxLevel={defaultMaxLevel}
						/>
					</CardContent>
				</Card>
			</div>
		</PageLayout>
	);
}
