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

		const token = await getToken();
		if (!token) {
			return { success: false, error: "No token available" };
		}

		const client = new HttpClient({
			schema,
			serverUrl: process.env.NEXT_PUBLIC_TRIPLIT_SERVER_URL,
			token,
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
