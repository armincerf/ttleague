"use client";

import { usePlayerTournament } from "@/lib/tournamentManager/hooks/usePlayerTournament";
import { WaitingPage } from "./components/WaitingPage";
import { PendingMatchPlayer } from "./components/PendingMatchPlayer";
import { PendingMatchUmpire } from "./components/PendingMatchUmpire";
import { OngoingMatchPlayer } from "./components/OngoingMatchPlayer";
import { OngoingMatchUmpire } from "./components/OngoingMatchUmpire";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function ActiveEvent({ eventId }: { eventId: string }) {
	const { user } = useUser();
	const userId = user?.id || "";
	const { loading, state } = usePlayerTournament(userId);

	if (loading || !userId) {
		return (
			<div className="flex justify-center items-center h-screen">
				loading...
			</div>
		);
	}

	if (state?.currentRole === "waiting" || (!state?.currentMatch && state?.id)) {
		return (
			<WaitingPage
				eventId={eventId}
				tournamentId={state.id}
				playerIds={new Set(state.playerIds.map((p) => p.id))}
			/>
		);
	}

	const isMatchOngoing = state?.currentMatch.status === "ongoing";

	if (state?.currentRole === "umpiring") {
		return isMatchOngoing ? (
			<OngoingMatchUmpire match={state.currentMatch} userId={userId} />
		) : (
			<PendingMatchUmpire userId={userId} match={state.currentMatch} />
		);
	}

	return isMatchOngoing ? (
		<OngoingMatchPlayer
			match={state.currentMatch}
			tournamentId={state.id}
			userId={userId}
		/>
	) : (
		<PendingMatchPlayer userId={userId} match={state.currentMatch} />
	);
}

export default function ActiveEventWrapper({ eventId }: { eventId: string }) {
	const queryClient = new QueryClient();
	return (
		<QueryClientProvider client={queryClient}>
			<ActiveEvent eventId={eventId} />
		</QueryClientProvider>
	);
}
