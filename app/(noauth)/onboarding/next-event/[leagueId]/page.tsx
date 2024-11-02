import { fetchNextEvent } from "@/lib/actions/events";
import { Card } from "@/components/ui/card";
import {
	MapPinIcon,
	UsersIcon,
	TableIcon,
	SparklesIcon,
	CoinsIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import StreakPattern from "@/components/StreakPattern";
import { CalendarLink } from "@/components/CalendarLink";
import Link from "next/link";
import { cn, getPriceLabel } from "@/lib/utils";
import { ClubLocationLinkComponent } from "@/components/ClubLocationLink";
import { SignUpButton } from "../SignUpButton";
import RegisteredPlayers from "../../components/RegisteredPlayers";

function EventDetails({
	label,
	children,
}: {
	label: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-2 text-muted-foreground rounded-lg hover:bg-primary/10 transition-all duration-300",
			)}
		>
			<div className="text-primary">{children}</div>
			<span>{label}</span>
		</div>
	);
}

export default async function NextEventPage({
	params,
}: {
	params: Promise<{ leagueId: string }>;
}) {
	const { leagueId } = await params;
	const event = await fetchNextEvent(leagueId);
	if (!event) return <div>No upcoming events</div>;

	return (
		<div className="container max-w-2xl py-8 h-full overflow-y-auto relative">
			<div className="fixed inset-0 opacity-80 ">
				<StreakPattern />
			</div>
			<div className="fixed top-0 p-4 rounded-b-xl left-0 right-0 z-30 bg-gradient-to-t from-background to-background/80 backdrop-blur-sm">
				<h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-tt-blue bg-clip-text text-transparent">
					Sign up for your first event!
				</h1>
			</div>
			<Card className="z-20 relative m-4 mt-12 mb-16 overflow-hidden backdrop-blur-sm bg-gradient-to-br from-background via-background to-background">
				<div className="p-6">
					<h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-tt-blue bg-clip-text text-transparent">
						{event.name}
					</h1>

					<div className="space-y-2 whitespace-nowrap">
						<CalendarLink
							name={event.name}
							description={`Table Tennis Event at ${event.venue}`}
							startTime={event.startTime}
							endTime={event.endTime}
							venue={event.venue}
						/>

						{event.club && (
							<EventDetails
								label={
									<ClubLocationLinkComponent
										club={event.club}
										className="underline"
									/>
								}
							>
								<MapPinIcon className="h-4 w-4" />
							</EventDetails>
						)}

						<EventDetails label={`${event.maxCapacity} player maximum`}>
							<UsersIcon className="h-4 w-4" />
						</EventDetails>

						<EventDetails label={`${event.tables} tables available`}>
							<TableIcon className="h-4 w-4" />
						</EventDetails>
						<EventDetails label="Skill Requirements - All Welcome">
							<SparklesIcon className="h-4 w-4" />
						</EventDetails>
						<EventDetails
							label={getPriceLabel(event.price_gbp, event.paymentOptions)}
						>
							<CoinsIcon className="h-4 w-4" />
						</EventDetails>
					</div>

					<RegisteredPlayers players={event.registeredPlayers} />

					<div className="mt-4 space-y-4">
						<h2 className="font-semibold bg-gradient-to-r from-primary to-tt-blue bg-clip-text text-transparent">
							About This Event
						</h2>
						<p className="text-muted-foreground">
							Join us for an exciting evening of competitive table tennis! Drop
							any time from {format(event.startTime, "h:mma")} and the app will
							automatically pair you with players for competitive matches.
						</p>

						<p className="text-muted-foreground">
							Play as many matches as you like - after each game, choose whether
							to continue playing or head home. All matches follow Winter League
							rules, and results are available in real-time so you can follow
							the games even if you can't make it.
						</p>

						<p className="text-muted-foreground">
							After participating in 3 events, you'll receive a ranking score
							that helps match you with players of similar skill levels, future
							events will include bracketed tournaments with prizes for the top
							players in each leaderboard.
						</p>
					</div>
				</div>
			</Card>

			<div className="container max-w-2xl mx-auto mt-8 z-30 fixed bottom-4 left-0 right-0">
				<div className="mx-6 flex gap-4 justify-center rounded-full bg-gradient-to-t from-background to-background/80 backdrop-blur-sm p-4 border">
					<SignUpButton eventId={event.id} />
					<Link href={`/leagues/${event.league_id}`}>
						<Button
							variant="outline"
							className="text-primary border-primary hover:bg-primary/10 text-wrap"
						>
							Sorry, can't make it
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
