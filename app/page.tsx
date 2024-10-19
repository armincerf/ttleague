"use client";
import { ClerkProvider, SignedIn, useUser } from "@clerk/clerk-react";
import { SignedOut, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function Redirecter() {
	const router = useRouter();
	const { user } = useUser();
	//hmmmmmmmmm
	useEffect(() => {
		if (!user) {
			setTimeout(() => {
				if (!user) {
					router.push("/sign-up");
				}
			}, 1000);
		}
	}, [router, user]);
	return null;
}

export default function Home() {
	return (
		<ClerkProvider
			publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""}
		>
			<SignedOut>
				<Redirecter />
			</SignedOut>
			<SignedIn>
				<div>Signed In</div>
			</SignedIn>
		</ClerkProvider>
	);
}
