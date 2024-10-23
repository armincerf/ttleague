import { fetchMatches } from "@/lib/actions/matches";
import { fetchEvent } from "@/lib/actions/events";
import { differenceInSeconds } from "date-fns";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
	CardContent,
} from "@/components/ui/card";
import { Suspense } from "react";
import CountdownTimer from "./CountdownTimer";
import { EventPageAuth } from "./EventPageAuth";
import { ClerkProvider } from "@clerk/nextjs";
import EventRegistrationButton from "./EventRegistrationButton";
import { EventRegisteredPlayers } from "./EventRegisteredPlayers";
import { AdminButton } from "./AdminButton";
import { AdminEventActions } from "./AdminEventActions";
import EventCard from "./EventCard";

export const experimental_ppr = true;

export default async function EventPage({
	params,
}: {
	params: Promise<{ eventId: string; leagueId: string }>;
}) {
	const { eventId } = await params;

	const [event, matches] = await Promise.all([
		fetchEvent(eventId),
		fetchMatches(eventId),
	]);

	return (
		<div className="container mx-auto pt-8 px-4">
			<EventRegisteredPlayers serverEvent={event} />
			<EventCard serverEvent={event} matches={matches} />
			<AdminButton>
				<AdminEventActions event={event} />
			</AdminButton>
		</div>
	);
}
