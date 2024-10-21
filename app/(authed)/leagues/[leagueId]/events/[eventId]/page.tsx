import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { MapPin, Calendar, Clock, Users } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { client } from "@/lib/triplit";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CountdownTimer from "./CountdownTimer";
import MatchList from "./MatchList";

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

async function fetchMatches(eventId: string) {
	return client.fetch(
		client
			.query("matches")
			.where("event_id", "=", eventId)
			.include("player1")
			.include("player2")
			.build(),
	);
}

export default async function EventPage({
	params,
}: {
	params: { leagueId: string; eventId: string };
}) {
	const { userId } = auth();
	const { eventId, leagueId } = params;
	const [event, matches] = await Promise.all([
		fetchEvent(eventId),
		fetchMatches(eventId),
	]);

	const now = new Date();
	const secondsUntilStart = differenceInSeconds(event.start_time, now);
	const isUpcoming = secondsUntilStart > 0;
	const isActive = event.status === "active";
	const isCompleted = event.status === "completed";

	const userMatches = matches.filter(
		(match) => match.player_1 === userId || match.player_2 === userId,
	);
	const nextMatch = userMatches.find((match) => match.status === "pending");

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

				{isUpcoming && (
					<Card className="mb-8">
						<CardHeader>
							<CardTitle>Event Starts In</CardTitle>
						</CardHeader>
						<CardContent>
							<CountdownTimer seconds={secondsUntilStart} />
						</CardContent>
					</Card>
				)}

				{isCompleted && (
					<Card className="mb-8">
						<CardContent>
							<p className="text-xl font-semibold">Event Completed</p>
						</CardContent>
					</Card>
				)}

				{isActive && nextMatch && (
					<Card className="mb-8">
						<CardHeader>
							<CardTitle>Your Next Match</CardTitle>
						</CardHeader>
						<CardContent>
							<p>
								vs{" "}
								{nextMatch.player_1 === userId
									? nextMatch.player2?.first_name
									: nextMatch.player1?.first_name}
							</p>
							<Button asChild className="mt-4">
								<Link href={`/matches/${nextMatch.id}`}>Go to Match</Link>
							</Button>
						</CardContent>
					</Card>
				)}

				{isActive && (
					<MatchList
						matches={matches}
						title="In Progress Matches"
						filter={(match) => match.status === "confirmed"}
					/>
				)}

				{isActive && (
					<MatchList
						matches={matches}
						title="Upcoming Matches"
						filter={(match) => match.status === "pending"}
					/>
				)}

				{(isActive || isCompleted) && (
					<MatchList
						matches={matches}
						title="Completed Matches"
						filter={(match) => match.status === "completed"}
					/>
				)}
			</div>
		</PageLayout>
	);
}
