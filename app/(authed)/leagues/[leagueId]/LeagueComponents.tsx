import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Season, Event } from "@/triplit/schema";
import { EventCard } from "@/components/EventCard";

export function SeasonList({
	title,
	seasons,
}: { title: string; seasons: Season[] }) {
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

export function EventList({
	title,
	events,
	showSeeAll = false,
	leagueId,
}: {
	title: string;
	events: Event[];
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
