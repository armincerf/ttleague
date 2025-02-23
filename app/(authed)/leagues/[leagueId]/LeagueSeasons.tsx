import { Suspense, use } from "react";
import { fetchSeasons } from "@/lib/actions/leagues";
import { fetchEvents } from "@/lib/actions/events";
import { SeasonList, EventList, PlayButton } from "./LeagueComponents";

function SeasonsContent({ leagueId }: { leagueId: string }) {
	const seasons = use(fetchSeasons(leagueId));
	const currentDate = new Date();
	const upcomingSeasons = seasons.filter(
		(s) => new Date(s.start_date) > currentDate,
	);
	const currentSeasons = seasons.filter(
		(s) =>
			new Date(s.start_date) <= currentDate &&
			new Date(s.end_date) >= currentDate,
	);
	const pastSeasons = seasons.filter((s) => new Date(s.end_date) < currentDate);

	return (
		<>
			<SeasonList title="Upcoming Seasons" seasons={upcomingSeasons} />
			<SeasonList title="Current Seasons" seasons={currentSeasons} />
			<SeasonList title="Past Seasons" seasons={pastSeasons} />
		</>
	);
}

async function EventsContent({ leagueId }: { leagueId: string }) {
	const events = await fetchEvents(leagueId);
	const currentDate = new Date();
	const upcomingEvents = events
		.filter((e) => new Date(e.start_time) > currentDate)
		.slice(0, 1);
	const pastEvents = events
		.filter((e) => new Date(e.end_time) < currentDate)
		.slice(0, 10);

	console.log({
		upcomingEvents,
		pastEvents,
	});

	return (
		<>
			<div className="mb-12">
				<h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
				<PlayButton eventId={"mock-event-id"} />
			</div>
			<EventList
				past={true}
				title="Past Events"
				events={pastEvents}
				showSeeAll={true}
				leagueId={leagueId}
			/>
		</>
	);
}

export default function LeagueSeasonsOrEvents({
	leagueId,
}: { leagueId: string }) {
	// TODO for now, just show events
	return (
		<Suspense fallback={<div>Loading seasons and events...</div>}>
			<EventsContent leagueId={leagueId} />
		</Suspense>
	);
}

function SeasonsOrEvents({ leagueId }: { leagueId: string }) {
	const seasons = use(fetchSeasons(leagueId));
	const hasSeasons = seasons.length > 0;

	return (
		<>
			{hasSeasons ? (
				<Suspense fallback={<div>Loading seasons...</div>}>
					<SeasonsContent leagueId={leagueId} />
				</Suspense>
			) : (
				<Suspense fallback={<div>Loading events...</div>}>
					<EventsContent leagueId={leagueId} />
				</Suspense>
			)}
		</>
	);
}
