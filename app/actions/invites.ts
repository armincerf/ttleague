"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

type InviteResult = { success: true } | { success: false; error: string };

export async function sendInvites(
	emails: string[],
	redirectUrl: string,
): Promise<InviteResult> {
	console.log("Sending invites", emails);
	const clerk = await clerkClient();

	try {
		await Promise.all(
			emails.map((email) =>
				clerk.invitations.createInvitation({
					emailAddress: email,
					redirectUrl,
					publicMetadata: {
						invitedVia: "event-signup",
					},
				}),
			),
		);

		revalidatePath("/");
		return { success: true };
	} catch (error) {
		console.error("invite error details:", JSON.stringify(error, null, 2));

		if (error instanceof Error && "clerkError" in error) {
			const clerkError = error as {
				errors?: { message?: string; longMessage?: string }[];
			};
			const errorMessage =
				clerkError.errors?.[0]?.longMessage ||
				clerkError.errors?.[0]?.message ||
				"Invalid email address or user already invited";
			return { success: false, error: errorMessage };
		}
		return { success: false, error: "Failed to send invites" };
	}
}
