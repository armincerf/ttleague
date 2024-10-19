"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const checkEmailExists = async (email: string): Promise<boolean> => {
	// This is a placeholder function that always returns false
	// In a real application, this would check against your user database
	return false;
};

export default function SignInButton() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { signIn } = useSignIn();
	const router = useRouter();

	const handleSignIn = async () => {
		if (!email) return;

		setIsLoading(true);

		try {
			const emailExists = await checkEmailExists(email);

			if (emailExists) {
				// If the email exists, proceed with sign in
				const signInAttempt = await signIn?.authenticateWithPasskey({
					flow: "discoverable",
				});

				if (signInAttempt?.status === "complete") {
					router.push("/dashboard");
				} else {
					console.error(JSON.stringify(signInAttempt, null, 2));
				}
			} else {
				// If the email doesn't exist, create a new account
				// For now, we'll just log a message. In a real app, you'd implement account creation here.
				console.log("Creating new account for:", email);
				// You might want to redirect to a registration page or open a registration modal
			}
		} catch (err) {
			console.error("Error:", JSON.stringify(err, null, 2));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<Input
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="Enter your email"
				className="w-full"
			/>
			<Button onClick={handleSignIn} className="w-full" disabled={isLoading}>
				{isLoading ? "Processing..." : "Sign In / Create Account"}
			</Button>
		</div>
	);
}
