import { formatDistanceToNow, format, parseISO, isThisYear } from "date-fns";
import Link from "next/link";
import { Users, Trophy, Table2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import RegisteredUsers from "./RegisteredUsers";
import { Skeleton } from "./ui/skeleton";
import { Suspense } from "react";
import type { Event } from "@/lib/actions/events";

function hashColor(clubId: string) {
	const nanoIdToNumber = (nanoId: string) =>
		Number.parseInt(nanoId.slice(0, 6), 36);
	const hue = (nanoIdToNumber(clubId) * 30) % 360;
	return `hsl(${hue}, 70%, 60%)`;
}

export function EventCard({
	event,
}: {
	event: Event;
}) {
	const date = new Date(event.start_time);
	const formattedDate = isThisYear(date)
		? format(date, "EEEE, MMMM d")
		: format(date, "EEEE, MMMM d, yyyy");
	const formattedTime = format(date, "h:mm a");
	const timeToEvent = formatDistanceToNow(date, { addSuffix: true });

	const statusColors = {
		active: "bg-green-500",
		cancelled: "bg-red-500",
		completed: "bg-blue-500",
		draft: "bg-yellow-500",
		scheduled: "bg-purple-500",
	};

	const colorHash = hashColor(event.club_id);

	function formatDescription(description: string | undefined): string {
		return description?.replace("\n", " ") ?? "";
	}

	return (
		<Card className="w-full max-w-2xl overflow-hidden">
			<div className={`h-2 ${statusColors[event.status]}`} />
			<CardHeader>
				<div className="flex justify-between items-start">
					<div>
						<h2 className="text-2xl font-bold">{event.name}</h2>
					</div>
					<div className="text-right">
						<p className="font-semibold">{formattedDate}</p>
						<p className="text-sm text-muted-foreground">{formattedTime}</p>
						<p className="text-xs text-muted-foreground mt-1">{timeToEvent}</p>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-center space-x-2 mb-4">
					{/* <Badge
						variant="outline"
						className="text-xs flex items-center"
						style={{ backgroundColor: colorHash, color: "#fff" }}
					>
						<Trophy className="w-3 h-3 mr-1" />
						Best of {event.best_of}
					</Badge> */}
					<Badge variant="secondary" className="text-xs">
						Status: {event.status}
					</Badge>
				</div>
				<p className="text-muted-foreground mb-4">
					{formatDescription(event.description)}
				</p>
				<div className="flex flex-col space-y-2">
					<div className="flex items-center space-x-2">
						<Table2 className="w-5 h-5 text-muted-foreground" />
						<span className="text-sm text-muted-foreground">
							{event.tables.size} {event.tables.size === 1 ? "table" : "tables"}
						</span>
					</div>
					<div className="flex items-center space-x-2">
						<Users className="w-5 h-5 text-muted-foreground" />
						<Suspense fallback={<Skeleton className="w-20 h-4" />}>
							<RegisteredUsers
								eventId={event.id}
								serverRegistrations={event.registrations}
								capacity={event.capacity}
							/>
						</Suspense>
					</div>
				</div>
			</CardContent>
			<CardFooter>
				<Button variant="outline" className="w-full" asChild>
					<Link href={`/events/${event.id}`}>View Event Details</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
