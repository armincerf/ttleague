"use client";

import { useState } from "react";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { checkAccountExists } from "@/lib/triplit";

export default function SignUpButton() {
	const { user } = useUser();
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
	console.log("user", user);

	const handleInitialSubmit = async () => {
		if (!email) return;
		setIsLoading(true);

		try {
			const accountExists = await checkAccountExists(email);
			console.log("accountExists", accountExists);
			setUserExists(accountExists);
			if (!accountExists) {
				await handleSignUp();
			}
		} catch (err) {
			console.error("Error:", JSON.stringify(err, null, 2));
			toast({
				title: "Error",
				description: "An error occurred. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignUp = async () => {
		if (!signUp) {
			console.error("SignUp is undefined");
			return;
		}

		try {
			await signUp.create({
				emailAddress: email,
			});
			await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
			setIsCodeSent(true);
			toast({
				title: "Verification code sent",
				description: "Please check your email for the verification code",
			});
		} catch (err) {
			console.error("Error:", JSON.stringify(err, null, 2));
			const errorMessage =
				err instanceof Error &&
				"errors" in err &&
				Array.isArray(err.errors) &&
				typeof err.errors[0] === "object" &&
				// @ts-expect-error - TODO: shrug emoji
				"longMessage" in err.errors[0] &&
				typeof err.errors[0].longMessage === "string"
					? err.errors[0].longMessage
					: "Failed to send verification code.";
			toast({
				title: "Error",
				description: errorMessage,
				variant: "destructive",
			});
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
				description: "Please check your credentials and try again",
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
				description: "Failed to send verification code.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerification = async () => {
		setIsLoading(true);
		try {
			if (userExists) {
				if (!signIn) {
					console.error("SignIn is undefined");
					return;
				}
				const attempt = await signIn.attemptFirstFactor({
					strategy: "email_code",
					code,
				});
				console.log("attempt", attempt);
				if (attempt.status === "complete") {
					await setActiveSignIn({ session: attempt.createdSessionId });
					router.push("/leaderboard");
				}
			} else {
				if (!signUp) {
					console.error("SignUp is undefined");
					return;
				}
				try {
					await signUp.validatePassword(password, {
						onValidation: (validation) => {
							if (
								validation.complexity &&
								Object.keys(validation.complexity).length > 0
							) {
								if (validation.complexity.max_length) {
									toast({
										title: "Password is too long",
										description: "Password must be between 8 and 64 characters",
										variant: "destructive",
									});
									return;
								}
								if (validation.complexity.min_length) {
									toast({
										title: "Password is too short",
										description: "Password must be between 8 and 64 characters",
										variant: "destructive",
									});
									return;
								}
								console.error("Password is too weak", validation);
								throw new Error("Password is too weak");
							}
						},
					});
					await signUp.update({
						password,
					});
					const attempt = await signUp.attemptEmailAddressVerification({
						code,
					});
					console.log("attempt", attempt);
					if (attempt.status === "complete") {
						await setActiveSignUp({ session: attempt.createdSessionId });
						router.push("/onboarding");
					}
				} catch (err) {
					const errStr =
						err instanceof Error
							? err.message.includes("weak")
								? err.message
								: JSON.stringify(err, null, 2)
							: JSON.stringify(err, null, 2);
					console.error("Error is:", JSON.stringify(err));
					if (JSON.stringify(err).includes("pwned")) {
						toast({
							title: "Password is too weak",
							description: "Please try again",
							variant: "destructive",
						});
						return;
					}
					if (errStr.includes("too weak")) {
						toast({
							title: "Password is too weak",
							description: "Please try again",
							variant: "destructive",
						});
						return;
					}
					toast({
						title: "Verification failed",
						description:
							"Please try again or contact support - make sure your password is strong",
						variant: "destructive",
					});
				}
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!isCodeSent) {
			handleInitialSubmit();
		} else if (userExists && password) {
			handleSignIn();
		} else {
			handleVerification();
		}
	};

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
			{userExists && !isCodeSent && (
				<>
					<Input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
						placeholder="Enter your password"
						className="w-full"
					/>
					<Button type="button" onClick={handleEmailCode} className="w-full">
						Send Code Instead
					</Button>
				</>
			)}
			{isCodeSent && (
				<Input
					type="text"
					value={code}
					onChange={(e) => setCode(e.target.value)}
					placeholder="Enter verification code"
					className="w-full"
				/>
			)}
			{!userExists && isCodeSent && (
				<Input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Create a password"
					autoComplete="new-password"
					className="w-full"
				/>
			)}
			<Button
				type="submit"
				className="w-full"
				disabled={isLoading}
				data-umami-event={
					isLoading
						? "Processing"
						: !isCodeSent
							? "Continue"
							: userExists
								? "Log In"
								: "Create Account"
				}
			>
				{isLoading
					? "Processing..."
					: !isCodeSent
						? "Continue"
						: userExists
							? "Log In"
							: "Create Account"}
			</Button>
		</form>
	);
}
