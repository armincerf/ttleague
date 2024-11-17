"use client";

import { usePlayerTournament } from "@/lib/tournamentManager/hooks/usePlayerTournament";
import { WaitingPage } from "./components/WaitingPage";
import { PendingMatchPlayer } from "./components/PendingMatchPlayer";
import { PendingMatchUmpire } from "./components/PendingMatchUmpire";
import { OngoingMatchPlayer } from "./components/OngoingMatchPlayer";
import { OngoingMatchUmpire } from "./components/OngoingMatchUmpire";
import { useUser } from "@/lib/hooks/useUser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { client } from "@/lib/triplit";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ActiveEvent({ eventId }: { eventId: string }) {
	const { user } = useUser();
	const userId = user?.id || "";
	const { loading, state, createActiveTournament } =
		usePlayerTournament(userId);

	const queryParams = useSearchParams();
	const signupRequested = queryParams.get("signupRequested");
	const router = useRouter();

	useEffect(() => {
		async function signUpForEvent() {
			const overrideUser = queryParams.get("overrideUser");
			if (!signupRequested || !overrideUser) return;
			await client.insert("event_registrations", {
				event_id: eventId,
				user_id: overrideUser,
				league_id: "mk-ttl-singles",
				confidence_level: 1,
			});
			router.replace(`/events/${eventId}/active?overrideUser=${overrideUser}`);
		}
		signUpForEvent();
	}, [signupRequested, router, eventId, queryParams]);

	useEffect(() => {
		async function checkActiveTournament() {
			if (loading) {
				const existing = await client.http.fetchOne(
					client
						.query("active_tournaments")
						.where([["event_id", "=", eventId]])
						.build(),
				);
				console.log("existing", existing);
				if (!existing) {
					createActiveTournament?.(eventId);
				}
			}
		}
		checkActiveTournament();
	}, [loading, eventId, createActiveTournament]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				loading...
			</div>
		);
	}

	if (!userId) {
		return <div>You must be logged in to view this page</div>;
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

	const isMatchOngoing = state?.currentMatch?.status === "ongoing";

	if (state?.currentRole === "umpiring" && state?.currentMatch) {
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
		<PendingMatchPlayer userId={userId} match={state?.currentMatch} />
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
