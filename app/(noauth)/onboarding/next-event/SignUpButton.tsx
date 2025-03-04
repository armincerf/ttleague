"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InvitePlayersModal } from "@/components/InvitePlayersModal";
import { useRouter } from "next/navigation";
import { client } from "@/lib/triplit";
import { useUser } from "@/lib/hooks/useUser";
import { usePostHog } from "posthog-js/react";

export function SignUpButton({ eventId }: { eventId: string }) {
	const [showInviteModal, setShowInviteModal] = useState(false);
	const router = useRouter();
	const { user } = useUser();
	const posthog = usePostHog();

	const handleSignUp = async () => {
		if (!user) {
			console.error("No user found");
			return;
		}

		posthog?.capture("signup_button_clicked", {
			eventId,
			distinctId: user.id,
		});

		await client.insert("event_registrations", {
			id: `${user.id}-${eventId}`,
			user_id: user.id,
			event_id: eventId,
			league_id: "mk-ttl-singles",
			confidence_level: 10,
		});

		console.log("Sign up complete");

		setShowInviteModal(true);
	};

	const handleInviteComplete = () => {
		setShowInviteModal(false);
		router.push("/leagues/mk-ttl-singles");
	};

	if (!user) {
		console.error("No user found");
		return <div>Loading user details...</div>;
	}

	return (
		<>
			<Button
				className="bg-tt-blue hover:bg-tt-blue/90 text-white px-8"
				onClick={handleSignUp}
			>
				Sign me up!
			</Button>

			<InvitePlayersModal
				userId={user.id}
				isOpen={showInviteModal}
				onClose={() => setShowInviteModal(false)}
				onComplete={handleInviteComplete}
			/>
		</>
	);
}
