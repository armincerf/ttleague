import PageLayout from "@/components/PageLayout";
import { EventCard } from "@/components/EventCard";
import { fetchLeague, fetchLeagues } from "@/lib/actions/leagues";
import { fetchEvents } from "@/lib/actions/events";
import { notFound } from "next/navigation";

// Next.js will invalidate the cache when a request comes in, at most once every 60 seconds.
export const revalidate = 60;

export const dynamicParams = true;

export async function generateStaticParams() {
	const leagues = await fetchLeagues();
	return leagues.map((league) => ({
		leagueId: league.id,
	}));
}

export default async function LeagueEventsPage({
	params,
}: {
	params: Promise<{ leagueId: string }>;
}) {
	const { leagueId } = await params;
	const [league, events] = await Promise.all([
		fetchLeague(leagueId),
		fetchEvents(leagueId),
	]);

	const currentDate = new Date();
	const upcomingEvents = events.filter(
		(e) => new Date(e.start_time) > currentDate,
	);
	const pastEvents = events.filter((e) => new Date(e.end_time) < currentDate);
	if (!league) notFound();

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
