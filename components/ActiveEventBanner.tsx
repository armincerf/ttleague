"use client";

import { client } from "@/lib/triplit";
import { useUser } from "@/lib/hooks/useUser";
import { useQueryOne } from "@triplit/react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

export default function ActiveEventBanner() {
	const { user } = useUser();
	const [isVisible, setIsVisible] = useState(true);
	const pathname = usePathname();
	// TODO - handle more than one active event
	const { result: event, fetching } = useQueryOne(
		client,
		client
			.query("events")
			.where(["status", "=", "active"])
			.include("registrations", (rel) =>
				rel("registrations")
					//@ts-expect-error needs fixing in triplit
					.where(["user_id", "=", user?.id ?? ""])
					.build(),
			)
			.select(["id", "name", "end_time"]),
	);
	const isRegistered = (event?.registrations?.length ?? 0) > 0;
	const isSignedIn = user !== null;
	const timeUntilEndInSeconds = event?.end_time
		? Math.max(0, new Date(event.end_time).getTime() - Date.now())
		: null;
	const eventNearlyOver =
		timeUntilEndInSeconds && timeUntilEndInSeconds < 1000 * 60 * 60;

	useEffect(() => {
		if (
			event &&
			!isRegistered &&
			localStorage.getItem(`dismissed-event-${event.id}`)
		) {
			setIsVisible(false);
		}
	}, [event, isRegistered]);

	function handleDismiss(eventId: string) {
		localStorage.setItem(`dismissed-event-${eventId}`, "true");
		setIsVisible(false);
	}

	if (
		pathname.includes("/events/") ||
		pathname.includes("/tournament") ||
		!isVisible ||
		fetching
	) {
		return null;
	}

	return (
		<div className="relative top-0 left-1/2 -translate-x-1/2 -mt-24 z-50 w-2/3">
			<div className="max-w-fit mx-auto px-4 py-2 rounded-b-lg shadow-md bg-primary-foreground relative">
				{event && !isRegistered && (
					<button
						type="button"
						onClick={() => handleDismiss(event.id)}
						className="absolute -right-2 -top-2 p-1 rounded-full bg-background shadow-sm hover:bg-muted"
					>
						<X className="h-3 w-3" />
					</button>
				)}
				{event ? (
					<Link
						href={
							isRegistered
								? `/events/${event.id}/active`
								: `/events/${event.id}`
						}
						className="flex flex-col items-center gap-1 text-primary hover:text-primary/80"
					>
						<span className="text-xs font-medium uppercase tracking-wide">
							Event in Progress
						</span>
						<h3 className="font-semibold">{event.name}</h3>
						<p className="text-xs text-muted-foreground">
							{!isSignedIn || (!isRegistered && eventNearlyOver)
								? "See live scores"
								: !isRegistered
									? "Register now, there's still time!"
									: null}
						</p>
						{isRegistered && <Button>Tap here when you're at the venue</Button>}
					</Link>
				) : null}
			</div>
		</div>
	);
}
