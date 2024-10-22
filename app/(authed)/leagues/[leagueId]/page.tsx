import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { client } from "@/lib/triplit";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import type { League, Season, Event } from "@/triplit/schema";
import FAQDialogButton from "./FAQDialogButton";
import RegisteredPlayersList from "./RegisteredPlayersList";
import { EventCard, type TEventCardEvent } from "@/components/EventCard";
import LeagueRegistrationButton from "./LeagueRegistrationButton";
import ClubLocationLink from "@/components/ClubLocationLink";
import { fetchLeague, fetchSeasons } from "@/lib/actions/leagues";
import { fetchEvents } from "@/lib/actions/events";
import { fetchUserForLeague } from "@/lib/actions/users";
import logger from "@/lib/logging";

function SeasonList({ title, seasons }: { title: string; seasons: Season[] }) {
	return (
		<Card className="mt-8">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				{seasons.length > 0 ? (
					<ul>
						{seasons.map((season) => (
							<li key={season.id}>
								{new Date(season.start_date).toLocaleDateString()} -{" "}
								{new Date(season.end_date).toLocaleDateString()}
							</li>
						))}
					</ul>
				) : (
					<p>No seasons found.</p>
				)}
			</CardContent>
		</Card>
	);
}

function EventList({
	title,
	events,
	showSeeAll = false,
	leagueId,
}: {
	title: string;
	events: TEventCardEvent[];
	showSeeAll?: boolean;
	leagueId?: string;
}) {
	return (
		<div className="mt-8">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-2xl font-semibold">{title}</h2>
				{showSeeAll && leagueId && (
					<Button asChild variant="outline">
						<Link href={`/leagues/${leagueId}/events`}>See All</Link>
					</Button>
				)}
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
				{events.map((event) => (
					<EventCard key={event.id} event={event} />
				))}
			</div>
		</div>
	);
}

async function InProgressSection({
	leagueId,
}: {
	leagueId: string;
}) {
	const { userId } = await auth();

	const [event, season, userInLeague] = await Promise.all([
		client.fetchOne(
			client
				.query("events")
				.where("league_id", "=", leagueId)
				.where("status", "=", "active")
				.build(),
		),
		client.fetchOne(
			client
				.query("seasons")
				.where("league_id", "=", leagueId)
				.where("status", "=", "active")
				.build(),
		),
		userId
			? client.fetchOne(
					client
						.query("users")
						.where([
							["id", "=", userId],
							["registered_league_ids", "has", leagueId],
						])
						.build(),
				)
			: null,
	]);

	const inProgressEvent = event;
	const inProgressSeason = season;

	const registeredPlayers = await client.fetch(
		client
			.query("event_registrations")
			.where([["event_id", "=", inProgressEvent?.id ?? ""]])
			.include("user")
			.build(),
	);

	if (!inProgressEvent && !inProgressSeason) return null;

	const activeItem = inProgressEvent || inProgressSeason;
	if (!activeItem) return null;

	const isUserRegistered = registeredPlayers?.some(
		(reg) => reg.user_id === userId,
	);

	const formatDate = (date: Date) => {
		return date.toLocaleString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	return (
		<div className="mb-8 relative">
			<div className="absolute top-0 left-0 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-tl-lg rounded-br-lg">
				{inProgressEvent ? "In Progress" : "Active"}
			</div>
			<Card className="pt-8">
				<CardHeader>
					<CardTitle>{activeItem.name}</CardTitle>
				</CardHeader>
				<CardContent>
					{inProgressEvent && (
						<>
							<p className="mb-2">
								Start: {formatDate(inProgressEvent.start_time)}
							</p>
							<p className="mb-4">
								End: {formatDate(inProgressEvent.end_time)}
							</p>
							<h4 className="font-semibold mb-2">
								{registeredPlayers.length} Players Attending
							</h4>
							{userInLeague && (
								<Button asChild>
									<Link
										href={
											isUserRegistered
												? `/leagues/${leagueId}/events/${inProgressEvent.id}`
												: `/leagues/${leagueId}/events/${inProgressEvent.id}/register`
										}
									>
										{isUserRegistered
											? "Go to Match Page"
											: "Register for Event"}
									</Link>
								</Button>
							)}
						</>
					)}
					{inProgressSeason && !inProgressEvent && (
						<>
							<p className="mb-2">
								Start: {formatDate(inProgressSeason.start_date)}
							</p>
							<p>End: {formatDate(inProgressSeason.end_date)}</p>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default async function LeaguePage({
	params,
}: {
	params: Promise<{ leagueId: string }>;
}) {
	const { userId } = await auth();
	const { leagueId } = await params;

	try {
		const [league, seasons, events, userInLeague] = await Promise.all([
			fetchLeague(leagueId),
			fetchSeasons(leagueId),
			fetchEvents(leagueId),
			userId ? fetchUserForLeague(userId, leagueId) : null,
		]);

		const currentDate = new Date();
		const upcomingSeasons = seasons.filter(
			(s) => new Date(s.start_date) > currentDate,
		);
		const currentSeasons = seasons.filter(
			(s) =>
				new Date(s.start_date) <= currentDate &&
				new Date(s.end_date) >= currentDate,
		);
		const pastSeasons = seasons.filter(
			(s) => new Date(s.end_date) < currentDate,
		);

		const upcomingEvents = events
			.filter((e) => new Date(e.start_time) > currentDate)
			.slice(0, 1);
		const pastEvents = events
			.filter((e) => new Date(e.end_time) < currentDate)
			.slice(0, 10);

		const hasSeasons = seasons.length > 0;

		logger.info({ leagueId }, "League page rendered successfully");
		return (
			<PageLayout>
				<div className="max-w-4xl mx-auto pb-24">
					<div className="flex items-center mb-6 h-16">
						<div className="w-44 h-16 mr-4 relative overflow-hidden">
							<Image
								src={league.logo_image_url}
								alt={`${league.name} logo`}
								fill
								className="object-cover"
							/>
						</div>
						<h1 className="text-3xl font-bold">{league.name}</h1>
					</div>

					<Card className="mb-8">
						<CardContent className="pt-6">
							<p className="mb-4">{league.description}</p>
							{league.clubs && league.clubs.length > 0 && (
								<div className="mb-4">
									<h3 className="text-sm font-semibold mb-2">
										{league.clubs.length === 1 ? "Location:" : "Locations:"}
									</h3>
									<ul>
										{league.clubs.map((club) => (
											<ClubLocationLink key={club.id} club={club} />
										))}
									</ul>
								</div>
							)}
							<FAQDialogButton faqHtml={league.faq_html} />
						</CardContent>
					</Card>

					<InProgressSection leagueId={leagueId} />

					<LeagueRegistrationButton leagueId={leagueId} />

					<RegisteredPlayersList leagueId={leagueId} leagueName={league.name} />

					{hasSeasons ? (
						<>
							<SeasonList title="Upcoming Seasons" seasons={upcomingSeasons} />
							<SeasonList title="Current Seasons" seasons={currentSeasons} />
							<SeasonList title="Past Seasons" seasons={pastSeasons} />
						</>
					) : (
						<>
							<EventList title="Upcoming Event" events={upcomingEvents} />
							<EventList
								title="Past Events"
								events={pastEvents}
								showSeeAll={true}
								leagueId={leagueId}
							/>
						</>
					)}
				</div>
			</PageLayout>
		);
	} catch (error) {
		logger.error({ leagueId, error }, "Error rendering league page");
		throw error;
	}
}
