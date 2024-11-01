"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Season } from "@/triplit/schema";
import { EventCard } from "@/components/EventCard";
import { useQuery } from "@triplit/react";
import { client } from "@/lib/triplit";
import { useMemo } from "react";
import { formatDate } from "date-fns";
import type { Event } from "@/lib/actions/events";
import * as R from "remeda";

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
								{formatDate(season.start_date, "dd MMM")} -{" "}
								{formatDate(season.end_date, "dd MMM")}
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
	past,
	title,
	events,
	showSeeAll = false,
	leagueId,
}: {
	title: string;
	events: Event[];
	showSeeAll?: boolean;
	leagueId?: string;
	past?: boolean;
}) {
	const query = useMemo(() => {
		return client
			.query("events")
			.where(
				past
					? ["end_time", "<", new Date().toISOString()]
					: ["start_time", ">", new Date().toISOString()],
			)
			.include("club")
			.include("matches", (rel) =>
				rel("matches")
					.include("player1")
					.include("player2")
					.include("games")
					.build(),
			)
			.include("registrations", (rel) =>
				rel("registrations").include("user").build(),
			);
	}, [past]);
	const { results: clientEvents } = useQuery(client, query);
	const leagueEvents = clientEvents ?? events;
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
				{leagueEvents.map((event) => (
					<EventCard key={event.id} event={event} />
				))}
			</div>
		</div>
	);
}
