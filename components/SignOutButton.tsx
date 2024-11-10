"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { usePostHog } from "posthog-js/react";
import { client } from "@/lib/triplit";

export default function SignOutButton() {
	const { signOut } = useClerk();
	const posthog = usePostHog();

	const handleSignOut = async () => {
		posthog.capture("sign_out");
		posthog.reset();
		await client.reset();
		await signOut({
			redirectUrl: "/",
		});
	};

	return <Button onClick={handleSignOut}>Sign Out</Button>;
}
