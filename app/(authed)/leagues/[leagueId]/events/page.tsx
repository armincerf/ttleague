import { notFound } from "next/navigation";
import { client } from "@/lib/triplit";
import PageLayout from "@/components/PageLayout";
import { EventCard, type TEventCardEvent } from "@/components/EventCard";
import type { League } from "@/triplit/schema";

async function fetchLeague(leagueId: string): Promise<League> {
	const league = await client.fetchOne(
		client.query("leagues").where("id", "=", leagueId).build(),
	);
	if (!league) notFound();
	return league;
}

async function fetchEvents(leagueId: string): Promise<TEventCardEvent[]> {
	const data = await client.fetch(
		client
			.query("events")
			.where("league_id", "=", leagueId)
			.include("club")
			.include("registrations")
			.build(),
	);

	return data.map((event) => ({
		...event,
		club: event.club ?? undefined,
		registrations: event.registrations ?? undefined,
	}));
}

export default async function LeagueEventsPage({
	params,
}: {
	params: { leagueId: string };
}) {
	const { leagueId } = params;
	const [league, events] = await Promise.all([
		fetchLeague(leagueId),
		fetchEvents(leagueId),
	]);

	const currentDate = new Date();
	const upcomingEvents = events.filter(
		(e) => new Date(e.start_time) > currentDate,
	);
	const pastEvents = events.filter((e) => new Date(e.end_time) < currentDate);

	return (
		<PageLayout>
			<div className="max-w-4xl mx-auto pb-24">
				<h1 className="text-3xl font-bold mb-8">{league.name} Events</h1>

				<div className="mb-12">
					<h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
						{upcomingEvents.map((event) => (
							<EventCard key={event.id} event={event} />
						))}
					</div>
				</div>

				<div>
					<h2 className="text-2xl font-semibold mb-4">Past Events</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
						{pastEvents.map((event) => (
							<EventCard key={event.id} event={event} />
						))}
					</div>
				</div>
			</div>
		</PageLayout>
	);
}
