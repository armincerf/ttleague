"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";

export default function SignUpButton() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [userExists, setUserExists] = useState(false);
	const [isCodeSent, setIsCodeSent] = useState(false);
	const { signUp, setActive: setActiveSignUp } = useSignUp();
	const { signIn, setActive: setActiveSignIn } = useSignIn();
	const router = useRouter();
	const { toast } = useToast();

	const handleInitialSubmit = async () => {
		if (!email) return;

		setIsLoading(true);

		try {
			if (!signUp) {
				console.error("SignUp is undefined");
				return;
			}

			// Start the sign-up process
			const signUpAttempt = await signUp.create({
				emailAddress: email,
			});

			// Prepare the email verification
			const emailLinkFlow = await signUpAttempt.createEmailLinkFlow();

			// Send the email verification
			await emailLinkFlow.startEmailLinkFlow({
				redirectUrl: `${window.location.origin}/onboarding`,
			});

			toast({
				title: "Email sent",
				description: "Please check your email for the verification link",
			});
		} catch (err) {
			if (err instanceof Error && "status" in err) {
				if (err.status === 422) {
					setUserExists(true);
				}
			} else {
				console.error("Error:", JSON.stringify(err, null, 2));
				toast({
					title: "Error",
					description: "An error occurred. Please try again.",
					variant: "destructive",
				});
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignIn = async () => {
		if (!email || !password) return;

		setIsLoading(true);

		try {
			if (!signIn) {
				console.error("SignIn is undefined");
				return;
			}

			const signInAttempt = await signIn.create({
				identifier: email,
				password,
			});

			if (signInAttempt.status === "complete") {
				await setActiveSignIn({ session: signInAttempt.createdSessionId });
				router.push("/leaderboard");
			} else {
				console.error(JSON.stringify(signInAttempt, null, 2));
				toast({
					title: "Sign-in incomplete",
					description: "Please try again or contact support",
					variant: "destructive",
				});
			}
		} catch (err) {
			console.error("Error:", JSON.stringify(err, null, 2));
			toast({
				title: "Sign-in failed",
				description:
					"Please check your credentials and try again, use the Magic Link if you can't remember your password",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleEmailCode = async () => {
		if (!email) return;

		setIsLoading(true);

		try {
			if (!signIn) {
				console.error("SignIn is undefined");
				return;
			}

			await signIn.create({
				strategy: "email_code",
				identifier: email,
			});

			setIsCodeSent(true);
			toast({
				title: "Verification code sent",
				description: "Please check your email for the verification code",
			});
		} catch (err) {
			console.error("Error:", JSON.stringify(err, null, 2));
			toast({
				title: "Error",
				description:
					"Failed to send verification code. This error has been reported to the Admin.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (userExists) {
			if (isCodeSent && code) {
				try {
					const attempt = await signIn?.attemptFirstFactor({
						strategy: "email_code",
						code,
					});
					console.log("attempt", attempt, signIn);
					if (attempt && attempt.status === "complete") {
						await setActiveSignIn?.({ session: attempt.createdSessionId });
						router.push("/leaderboard");
					}
				} catch (err) {
					if (JSON.stringify(err).includes("session_exists")) {
						router.push("/leaderboard");
					}
					console.error("Error:", JSON.stringify(err, null, 2));
					toast({
						title: "Sign-in failed",
						description: "Please try again",
						variant: "destructive",
					});
				}
			} else if (password) {
				handleSignIn();
			}
		} else {
			handleInitialSubmit();
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<Input
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="Enter your email"
				autoComplete="email"
				className="w-full"
			/>
			{!userExists && (
				<Button type="submit" className="w-full" disabled={isLoading}>
					{isLoading ? "Processing..." : "Continue"}
				</Button>
			)}
			{userExists && (
				<>
					{isCodeSent ? (
						<Input
							type="text"
							value={code}
							onChange={(e) => setCode(e.target.value)}
							placeholder="Enter verification code"
							className="w-full"
						/>
					) : (
						<Input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
							placeholder="Enter your password"
							className="w-full"
						/>
					)}
					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Processing..." : userExists ? "Sign In" : "Continue"}
					</Button>
					<div className="flex items-center my-4">
						<Separator className="flex-grow w-auto" />
						<span className="px-4 text-gray-500 text-sm">Or</span>
						<Separator className="flex-grow w-auto" />
					</div>
					<Button
						type="button"
						onClick={handleEmailCode}
						className="w-full"
						disabled={isLoading}
					>
						Send Verification Code
					</Button>
				</>
			)}
		</form>
	);
}
