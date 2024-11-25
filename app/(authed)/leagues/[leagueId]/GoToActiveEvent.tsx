"use client";

import type { Event } from "@/lib/actions/events";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/triplit";
import { useRouter } from "next/navigation";
import { tournamentService } from "@/lib/tournamentManager/hooks/useTournament";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/lib/hooks/useUser";

type GoToActiveEventProps = {
	event: Event;
};

async function maybeCreateTournament(
	event: Event,
	handleGoToEvent: () => void,
	userId: string,
) {
	if (!event) {
		return;
	}
	try {
		const existingTournament = await client.fetchById(
			"active_tournaments",
			event.id,
		);
		if (existingTournament) {
			//console.log("existing tournament", existingTournament);
			handleGoToEvent();
			return;
		}
	} catch (error) {
		console.error("Error setting up tournament:", error);
		toast({
			title: "Error",
			variant: "destructive",
			description: "Failed to create tournament",
		});
		return;
	}
}

export default function GoToActiveEvent({ event }: GoToActiveEventProps) {
	const router = useRouter();
	const { user } = useUser();
	function handleGoToEvent() {
		router.push(`/events/${event?.id}/active`);
	}
	if (!event) {
		return null;
	}
	return (
		<div className="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-background p-4">
			<h1 className="text-2xl font-bold text-center">
				Ready to join {event.name}?
			</h1>

			<Button
				disabled={!event || !user}
				onClick={() => {
					if (user) {
						handleGoToEvent();
					}
				}}
				size="lg"
				className="w-64 h-24 text-xl"
			>
				Go to Event
			</Button>

			<Button
				variant="ghost"
				size="sm"
				className={cn(
					"text-xs text-muted-foreground",
					"hover:text-destructive",
				)}
				onClick={() => {
					// TODO: Implement cancellation logic
				}}
			>
				Can&apos;t Make It
			</Button>
		</div>
	);
}
