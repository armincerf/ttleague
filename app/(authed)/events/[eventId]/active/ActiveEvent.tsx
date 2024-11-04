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

export default function ActiveEvent({ eventId }: { eventId: string }) {
	const { user } = useUser();
	//const userId = user?.id;
	const [userId, setUserId] = useState("");
	const { loading, state } = usePlayerTournament(userId);
	console.log(state);

	function UserIdInput() {
		return <Input type="text" onBlur={(e) => setUserId(e.target.value)} />;
	}

	if (loading || !userId) {
		return (
			<div className="flex justify-center items-center h-screen">
				<UserIdInput />
				loading...
			</div>
		);
	}

	if (state?.currentRole === "waiting" || !state?.currentMatch) {
		return <WaitingPage />;
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
