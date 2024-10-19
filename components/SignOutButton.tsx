"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function SignOutButton() {
	const { signOut } = useClerk();

	const handleSignOut = async () => {
		await signOut({
			redirectUrl: "/",
		});
	};

	return <Button onClick={handleSignOut}>Sign Out</Button>;
}
