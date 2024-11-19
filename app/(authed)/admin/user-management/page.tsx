"use client";

import { useQuery } from "@triplit/react";
import { client } from "@/lib/triplit";
import { ComboBox } from "@/components/ComboBox";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { verifyEmail, unverifyEmail } from "@/app/actions/users";
import { toast } from "@/hooks/use-toast";

interface ClerkError extends Error {
	errors?: Array<{
		code?: string;
		message?: string;
		longMessage?: string;
		meta?: {
			paramName?: string;
			sessionId?: string;
			emailAddresses?: string;
			identifiers?: string;
			zxcvbn?: string;
		};
	}>;
	status?: number;
	clerkTraceId?: string;
	clerkError?: boolean;
}

export default function UserManagementPage() {
	const [selectedUserId, setSelectedUserId] = useState<string>("");
	const { results: users } = useQuery(
		client,
		client.query("users").select(["id", "first_name", "last_name", "email"]),
	);

	const userOptions =
		users?.map((user) => ({
			value: user.id,
			label: `${user.first_name} ${user.last_name} (${user.email})`,
		})) ?? [];

	const selectedUser = users?.find((user) => user.id === selectedUserId);

	async function handleVerifyEmail() {
		if (!selectedUser) return;

		try {
			await verifyEmail(selectedUser.id);
			toast({
				title: "Success",
				description: "Email verified successfully",
			});
		} catch (error) {
			const clerkError = error as ClerkError;
			const errorMessage = clerkError.errors?.[0]?.longMessage || clerkError.message || "Failed to verify email";

			toast({
				variant: "destructive",
				title: "Error",
				description: errorMessage,
			});
		}
	}

	async function handleUnverifyEmail() {
		if (!selectedUser) return;

		try {
			await unverifyEmail(selectedUser.id);
			toast({
				title: "Success",
				description: "Email unverified successfully",
			});
		} catch (error) {
			const clerkError = error as ClerkError;
			const errorMessage = clerkError.errors?.[0]?.longMessage || clerkError.message || "Failed to unverify email";

			toast({
				variant: "destructive",
				title: "Error",
				description: errorMessage,
			});
		}
	}

	return (
		<div className="space-y-6 p-6">
			<h1 className="text-2xl font-bold">User Management</h1>

			<ComboBox
				options={userOptions}
				value={selectedUserId}
				onChange={setSelectedUserId}
				placeholder="Select user..."
				searchPlaceholder="Search users..."
				emptyText="No users found"
			/>

			{selectedUser && (
				<div className="space-y-4">
					<div className="flex gap-4">
						<Button onClick={handleVerifyEmail}>Verify Email</Button>
						<Button onClick={handleUnverifyEmail} variant="destructive">
							Unverify Email
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
