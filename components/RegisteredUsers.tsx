"use client";
import { useQuery } from "@triplit/react";
import { client } from "@/lib/triplit";
import type { Event } from "@/lib/actions/events";

export default function RegisteredUsers({
	eventId,
	serverRegistrations,
	capacity,
}: {
	eventId: string;
	serverRegistrations?: NonNullable<Event>["registrations"];
	capacity?: number;
}) {
	const { results: registrations } = useQuery(
		client,
		client.query("event_registrations").where("event_id", "=", eventId),
	);
	const registeredUserCount =
		registrations?.length ?? serverRegistrations?.length ?? 0;
	const placesRemaining = capacity ? capacity - registeredUserCount : undefined;
	return (
		<span className="text-sm text-muted-foreground">
			{registeredUserCount} users registered
			{placesRemaining !== undefined &&
				` (${placesRemaining} places remaining)`}
		</span>
	);
}
