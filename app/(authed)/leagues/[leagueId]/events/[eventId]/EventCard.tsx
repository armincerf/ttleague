"use client";

import { useQueryOne } from "@triplit/react";
import { client } from "@/lib/triplit";
import { eventQuery } from "@/lib/actions/events";
import type { Event } from "@/lib/actions/events";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { differenceInSeconds, formatDate } from "date-fns";
import { ClerkProvider } from "@clerk/nextjs";
import { EventPageAuth } from "./EventPageAuth";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { CountdownTimerDisplay } from "./CountdownTimer";

const CountdownTimer = dynamic(() => import("./CountdownTimer"), {
	ssr: false,
	loading: () => <CountdownTimerDisplay seconds={0} />,
});

const EventRegistrationButton = dynamic(
	() => import("./EventRegistrationButton"),
	{
		ssr: false,
		loading: () => (
			<Button variant="outline" className="w-full" disabled>
				Loading...
			</Button>
		),
	},
);

function EventCard({
	serverEvent,
}: {
	serverEvent: Event;
}) {
	const { result: liveEvent } = useQueryOne(
		client,
		// @ts-expect-error - not worth fixing
		eventQuery(client, serverEvent.id),
	);

	const event = liveEvent || serverEvent;
	const now = new Date();
	const secondsUntilStart = differenceInSeconds(event.start_time, now);
	const isUpcoming = event.status === "scheduled";
	const isActive = event.status === "active";
	const isCompleted = event.status === "completed";

	if (isActive) {
		return (
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>{event.name}</CardTitle>
					<CardDescription>
						Started At: {formatDate(event.start_time, "dd MMM - h:mm a")}
						<br />
						{event.description}
					</CardDescription>
					<CardContent className="p-0">
						<ClerkProvider dynamic>
							<EventPageAuth event={event} />
						</ClerkProvider>
					</CardContent>
				</CardHeader>
			</Card>
		);
	}

	if (isUpcoming) {
		return (
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Event Starts In</CardTitle>
				</CardHeader>
				<CardDescription className="px-6 pb-2">
					{event.name} - {formatDate(event.start_time, "dd MMM - h:mm a")}
					<br />
					{event.club && (
						<>
							Location: {event.club.name}
							<br />
						</>
					)}
					{event.description}
				</CardDescription>
				<CardContent>
					<CountdownTimer seconds={secondsUntilStart} event={event} />
					<div className="flex flex-col gap-4 mt-2">
						<ClerkProvider dynamic>
							<EventPageAuth event={event} />
						</ClerkProvider>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (isCompleted) {
		return (
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Event Completed</CardTitle>
					<CardDescription>
						{event.name} - {event.start_time.toLocaleString()}
					</CardDescription>
					<CardContent>
						<h2>Results</h2>
						{/* {matches.map((match) => (
                            <MatchCard key={match.id} match={match} />
                        ))} */}
					</CardContent>
				</CardHeader>
			</Card>
		);
	}

	return null;
}

export default EventCard;
