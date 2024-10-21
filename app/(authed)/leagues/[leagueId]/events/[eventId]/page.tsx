import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { MapPin, Calendar, Clock, Users } from "lucide-react";
import { format, differenceInSeconds, formatDistanceToNow } from "date-fns";
import { client } from "@/lib/triplit";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CountdownTimer from "./CountdownTimer";
import MatchList from "./MatchList";
import ClubLocationLink from "@/components/ClubLocationLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
	params: Promise<{ leagueId: string; eventId: string }>;
}) {
	const { userId } = auth();
	const { eventId, leagueId } = await params;
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
	const nextOpponent =
		nextMatch?.player_1 === userId ? nextMatch.player2 : nextMatch?.player1;
	const nextTable = nextMatch?.table_number;
	const tableMatches = matches.filter(
		(match) => match.table_number === nextTable,
	);
	const tableMatchInProgress = tableMatches.some(
		(match) => match.status === "confirmed" && !match.winner,
	);

	return (
		<PageLayout>
			<div className="max-w-4xl mx-auto pb-24">
				<h1 className="text-3xl font-bold mb-6">{event.name}</h1>

				<Card className="mb-8">
					<CardContent className="pt-6 flex flex-col gap-4">
						{event.club && (
							<ClubLocationLink
								club={event.club}
								iconClassName="w-6 h-6 text-black"
								textClassName="text-black"
							/>
						)}
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
					</CardContent>
				</Card>

				{isUpcoming && (
					<Card className="mb-8">
						<CardHeader>
							<CardTitle>Event Starts In</CardTitle>
						</CardHeader>
						<CardContent>
							<CountdownTimer seconds={secondsUntilStart} event={event} />
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

				{nextMatch && (
					<Card className="mb-8">
						<CardHeader>
							<CardTitle>Your Next Match</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="flex flex-row items-center gap-2">
								You <span className="font-semibold">vs</span>
								<Avatar>
									<AvatarImage src={nextOpponent?.profile_image_url} />
									<AvatarFallback>
										{nextOpponent?.first_name[0]}
										{nextOpponent?.last_name[0]}
									</AvatarFallback>
								</Avatar>
								{nextOpponent?.first_name} {nextOpponent?.last_name}
							</p>
							<p className="text-sm text-gray-500 pt-2">
								Table {nextMatch.table_number} -{" "}
								{tableMatchInProgress
									? "After one more match is finished"
									: "Table should be free"}
							</p>
							<Button asChild className="mt-4">
								<Link
									href={`/leagues/${leagueId}/events/${eventId}/matches/${nextMatch.id}`}
								>
									Enter Match Scores
								</Link>
							</Button>
						</CardContent>
					</Card>
				)}

				{isActive && (
					<MatchList
						eventId={eventId}
						title="In Progress Matches"
						status="in_progress"
					/>
				)}

				{isActive && (
					<MatchList
						eventId={eventId}
						title="Upcoming Matches"
						status="pending"
					/>
				)}

				{(isActive || isCompleted) && (
					<MatchList
						eventId={eventId}
						title="Completed Matches"
						status="completed"
					/>
				)}
			</div>
		</PageLayout>
	);
}
