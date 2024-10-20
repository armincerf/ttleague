"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { leagueDivisions } from "@/lib/ratingSystem";
import { checkAccountExists, client } from "@/lib/triplit";
import { initialRating } from "@/lib/ratingSystem";
import { redirect } from "next/navigation";

const schema = z.object({
	email: z.string().email(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	currentLeagueDivision: z.enum(leagueDivisions).optional(),
	tableTennisEnglandId: z.string().regex(/^\d{6}$/, "Must be a 6-digit number"),
	profilePicture: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof schema>;

export async function getUserData() {
	const { userId } = auth();
	if (!userId) {
		throw new Error("User not authenticated");
	}

	// Fetch user data from Clerk
	const user = await currentUser();
	if (!user) {
		throw new Error("User not found");
	}

	return {
		email: user.emailAddresses[0]?.emailAddress || "",
		firstName: user.firstName || "",
		lastName: user.lastName || "",
	};
}

export async function submitForm(formData: FormData) {
	const { userId } = auth();
	if (!userId) {
		throw new Error("User not authenticated");
	}

	// Validate form data
	const validatedData = schema.parse(formData);

	// Update user data in Clerk
	await clerkClient.users.updateUser(userId, {
		firstName: validatedData.firstName,
		lastName: validatedData.lastName,
	});

	// Check if account already exists in Triplit
	const accountExists = await checkAccountExists(userId);
	if (accountExists) {
		throw new Error("An account with this user ID already exists.");
	}

	// Insert user data into Triplit
	await client.http.insert("users", {
		id: userId,
		table_tennis_england_id: validatedData.tableTennisEnglandId,
		email: validatedData.email,
		first_name: validatedData.firstName,
		last_name: validatedData.lastName,
		rating: initialRating(validatedData.currentLeagueDivision),
		matches_played: 0,
		wins: 0,
		losses: 0,
		no_shows: 0,
	});

	redirect("/dashboard");
}
