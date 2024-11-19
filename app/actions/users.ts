"use server";

import { HttpClient } from "@triplit/client";
import { schema } from "@/triplit/schema";
import type { OnboardingFormValues } from "../(noauth)/onboarding/schema";
import { initialRating } from "@/lib/ratingSystem";
import { auth, clerkClient } from "@clerk/nextjs/server";

type CreateUserResult =
	| { success: true; email: string }
	| { success: false; error: string };

export async function createUser(
	formData: OnboardingFormValues,
): Promise<CreateUserResult> {
	try {
		const { userId, getToken } = await auth();
		if (!userId) {
			return { success: false, error: "Not authenticated" };
		}

		const client = new HttpClient({
			schema,
			serverUrl: process.env.NEXT_PUBLIC_TRIPLIT_SERVER_URL,
			token: process.env.TRIPLIT_SERVICE_TOKEN,
		});

		const result = await client.insert("users", {
			id: userId,
			table_tennis_england_id: formData.tableTennisEnglandId,
			email: formData.email,
			first_name: formData.firstName,
			last_name: formData.lastName,
			rating: 0,
			current_division: formData.currentLeagueDivision,
			registered_league_ids: new Set(["mk-ttl-singles"]),
			matches_played: 0,
			wins: 0,
			losses: 0,
			no_shows: 0,
		});
		const clerk = await clerkClient();
		await clerk.users.updateUserMetadata(userId, {
			publicMetadata: {
				type: "user",
			},
		});

		return { success: true, email: result.output.email };
	} catch (error) {
		console.error("Error creating user:", error);
		return {
			success: false,
			error: "Failed to create user",
		};
	}
}

export async function verifyEmail(userId: string) {
	const clerk = await clerkClient();
	const user = await clerk.users.getUser(userId);
	const primaryEmailId = user.primaryEmailAddressId;

	if (!primaryEmailId) {
		throw new Error("User has no primary email");
	}
	try {
		await clerk.emailAddresses.updateEmailAddress(primaryEmailId, {
			verified: true,
		});
	} catch (error) {
		const email = await clerk.emailAddresses.getEmailAddress(primaryEmailId);
		console.error("Error verifying email:", {
			error,
			email,
		});
		throw error;
	}
}

export async function unverifyEmail(userId: string) {
	try {
		const clerk = await clerkClient();
		const user = await clerk.users.getUser(userId);
		const primaryEmailId = user.primaryEmailAddressId;

		if (!primaryEmailId) {
			throw new Error("User has no primary email");
		}

		console.log("Attempting to unverify email:", {
			userId,
			primaryEmailId,
			email: user.primaryEmailAddress?.emailAddress,
		});

		const response = await clerk.emailAddresses.updateEmailAddress(
			primaryEmailId,
			{ verified: false },
		);

		console.log("Clerk API Response:", response);
		return response;
	} catch (error) {
		console.error("Detailed unverify error:", {
			error,
			message: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});
		throw error;
	}
}
