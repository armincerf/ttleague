"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InvitePlayersModal } from "@/components/InvitePlayersModal";
import { useRouter } from "next/navigation";
import { client } from "@/lib/triplit";
import { useUser } from "@clerk/nextjs";

export function SignUpButton({ eventId }: { eventId: string }) {
	const [showInviteModal, setShowInviteModal] = useState(false);
	const router = useRouter();
	const { user } = useUser();

	const handleComplete = async () => {
		if (!user) {
			console.error("No user found");
			return;
		}
		setShowInviteModal(false);
		await client.insert("event_registrations", {
			user_id: user.id,
			event_id: eventId,
			league_id: "mk-ttl-singles",
			confidence_level: 10,
		});
		router.push("/leagues/mk-ttl-singles");
	};

	return (
		<>
			<Button
				className="bg-tt-blue hover:bg-tt-blue/90 text-white px-8"
				onClick={() => setShowInviteModal(true)}
			>
				Sign me up!
			</Button>

			<InvitePlayersModal
				isOpen={showInviteModal}
				onClose={() => setShowInviteModal(false)}
				onComplete={handleComplete}
			/>
		</>
	);
}
