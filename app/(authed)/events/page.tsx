import PageLayout from "@/components/PageLayout";
import { HttpClient } from "@triplit/client";
import { schema } from "@/triplit/schema";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { formatDistanceToNow, format, parseISO, isThisYear } from "date-fns";
import Link from "next/link";
import { MapPin, Users, Trophy, Table2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const httpClient = new HttpClient({
	serverUrl: process.env.TRIPLIT_DB_URL,
	token: process.env.TRIPLIT_ANON_TOKEN,
	schema,
});

function fetchEvents() {
	const now = new Date();

	const futureEventsQuery = httpClient
		.query("events")
		.where("start_time", ">=", now)
		.order("start_time", "ASC")
		.include("club")
		.include("registrations")
		.limit(5)
		.build();

	const pastEventsQuery = httpClient
		.query("events")
		.where("start_time", "<", now)
		.order("start_time", "DESC")
		.include("club")
		.include("registrations")
		.limit(5)
		.build();

	return Promise.all([
		httpClient.fetch(futureEventsQuery),
		httpClient.fetch(pastEventsQuery),
	]);
}

type TEvent = Awaited<ReturnType<typeof fetchEvents>>[0][0];

function hashColor(location: string, bestOf: number) {
	const hash = location
		.split("")
		.reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
	const hue = (hash + bestOf * 30) % 360;
	return `hsl(${hue}, 70%, 60%)`;
}

function EventCard({ event }: { event: TEvent }) {
	const date = event.start_time;
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

	const colorHash = hashColor(event?.club?.name ?? "", event.best_of);
	console.log(event);

	return (
		<Card className="w-full max-w-2xl overflow-hidden">
			<div className={`h-2 ${statusColors[event.status]}`} />
			<CardHeader>
				<div className="flex justify-between items-start">
					<div>
						<h2 className="text-2xl font-bold">{event.name}</h2>
						<p className="text-muted-foreground flex items-center mt-1">
							<MapPin className="w-4 h-4 mr-1" />
							{event.club?.name}
						</p>
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
					<Badge
						variant="outline"
						className="text-xs flex items-center"
						style={{ backgroundColor: colorHash, color: "#fff" }}
					>
						<Trophy className="w-3 h-3 mr-1" />
						Best of {event.best_of}
					</Badge>
					<Badge variant="secondary" className="text-xs">
						Status: {event.status}
					</Badge>
				</div>
				<p className="text-muted-foreground mb-4">{event.description}</p>
				<div className="flex flex-col space-y-2">
					<div className="flex items-center space-x-2">
						<Table2 className="w-5 h-5 text-muted-foreground" />
						<span className="text-sm text-muted-foreground">
							{event.club?.tables}{" "}
							{event.club?.tables === 1 ? "table" : "tables"}
						</span>
					</div>
					<div className="flex items-center space-x-2">
						<Users className="w-5 h-5 text-muted-foreground" />
						<span className="text-sm text-muted-foreground">
							{event.registrations?.length ?? 0} users registered
						</span>
					</div>
				</div>
			</CardContent>
			<CardFooter>
				<Button className="w-full" asChild>
					<Link href={`/events/${event.id}`}>View Event Details</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}

export default async function EventsPage() {
	const [futureEvents, pastEvents] = await fetchEvents();

	return (
		<PageLayout>
			<h1 className="text-3xl font-bold mb-6">Events</h1>

			<h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
			<div className="space-y-6 mb-8">
				{futureEvents.map((event) => (
					<EventCard key={event.id} event={event} />
				))}
			</div>

			<h2 className="text-2xl font-semibold mb-4">Past Events</h2>
			<div className="space-y-6 pb-24">
				{pastEvents.map((event) => (
					<EventCard key={event.id} event={event} />
				))}
			</div>
		</PageLayout>
	);
}
