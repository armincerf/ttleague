import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { MapPin, Calendar, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { client } from "@/lib/triplit";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
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

export default async function EventPage({
	params,
}: { params: Promise<{ eventId: string }> }) {
	const { userId } = auth();
	const { eventId } = await params;
	const [event, user] = await Promise.all([
		fetchEvent(eventId),
		userId ? fetchUser(userId) : null,
	]);

	const userDivisionIndex = user
		? sortedLeagueDivisions.indexOf(user.current_division)
		: -1;
	const defaultMinLevel = Math.max(0, userDivisionIndex - 2);
	const defaultMaxLevel = Math.min(
		sortedLeagueDivisions.length - 1,
		userDivisionIndex + 2,
	);

	return (
		<PageLayout>
			<div className="max-w-4xl mx-auto pb-24">
				<h1 className="text-3xl font-bold mb-6">{event.name}</h1>

				<Card className="mb-8">
					<CardContent className="pt-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-center">
								<MapPin className="mr-2" />
								<span>{event.club?.name}</span>
							</div>
							<div className="flex items-center">
								<Calendar className="mr-2" />
								<span>{format(event.start_time, "MMMM d, yyyy")}</span>
							</div>
							<div className="flex items-center">
								<Clock className="mr-2" />
								<span>{format(event.start_time, "h:mm a")}</span>
							</div>
							<div className="flex items-center">
								<Users className="mr-2" />
								<span>{event.registrations?.length ?? 0} registered</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Event Description</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Best of {event.best_of}</p>
						<p>{event.description}</p>
					</CardContent>
				</Card>

				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Club Information</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="mb-4">
							{event.club?.name} - {event.club?.tables} tables available
						</p>
						<Button asChild>
							<Link
								href={`https://www.google.com/maps/search/?api=1&query=${event.club?.latitude},${event.club?.longitude}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								Get Directions
							</Link>
						</Button>
					</CardContent>
				</Card>

				<Card className="mt-8">
					<CardHeader>
						<CardTitle>Registered Players In Your Selected Level</CardTitle>
					</CardHeader>
					<CardContent>
						<ParticipantsTable eventId={event.id} />
					</CardContent>
				</Card>
				{userId ? (
					<RegistrationForm
						eventId={event.id}
						userId={userId}
						defaultMinLevel={sortedLeagueDivisions[defaultMinLevel]}
						defaultMaxLevel={sortedLeagueDivisions[defaultMaxLevel]}
					/>
				) : (
					<Card className="mt-8">
						<CardContent className="pt-6">
							<p className="mb-4">Sign in to register for this event.</p>
							<Button asChild>
								<Link
									href={`/sign-up?redirect=${encodeURIComponent(
										`/events/${eventId}`,
									)}`}
								>
									Sign In to Register
								</Link>
							</Button>
						</CardContent>
					</Card>
				)}
			</div>
		</PageLayout>
	);
}
