"use client";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { client } from "@/lib/triplit";
import type { EventRegistration } from "@/triplit/schema";
import logger from "@/lib/logging";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useQuery, useQueryOne } from "@triplit/react";
import posthog from "posthog-js";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { handleSyncFailure } from "@/lib/triplit-utils";
import { SignUpButton } from "@clerk/nextjs";

type EventRegistrationButtonProps = {
	eventId: string;
	leagueId: string;
	serverEventRegistration?: EventRegistration;
};

async function registerForEvent(data: EventRegistration) {
	return new Promise<void>((resolve, reject) => {
		client
			.transact(async (tx) => {
				await tx.insert("event_registrations", data);
			})
			.then(({ txId }) => {
				if (!txId) {
					reject(new Error("No transaction ID received"));
					return;
				}

				client.syncEngine.onTxCommit(txId, () => {
					posthog.capture("registering for event", {
						eventId: data.event_id,
						leagueId: data.league_id,
					});
					resolve();
				});

				client.syncEngine.onTxFailure(
					txId,
					handleSyncFailure(
						txId,
						"Failed to register for event",
						{ data },
						reject,
					),
				);
			})
			.catch((error) => {
				logger.error("Failed to register for event (optimistic)", {
					error,
					data,
				});
				reject(new Error("Failed to register for event"));
			});
	});
}

async function unregisterFromEvent(eventRegistrationId: string) {
	return new Promise<void>((resolve, reject) => {
		client
			.transact(async (tx) => {
				await tx.delete("event_registrations", eventRegistrationId);
			})
			.then(({ txId }) => {
				if (!txId) {
					reject(new Error("No transaction ID received"));
					return;
				}

				client.syncEngine.onTxCommit(txId, () => {
					posthog.capture("unregistering from event", { eventRegistrationId });
					resolve();
				});

				client.syncEngine.onTxFailure(
					txId,
					handleSyncFailure(
						txId,
						"Failed to unregister from event",
						{ eventRegistrationId },
						reject,
					),
				);
			});
	});
}

export default function EventRegistrationButton({
	eventId,
	leagueId,
	serverEventRegistration,
}: EventRegistrationButtonProps) {
	const { user } = useUser();
	const userId = user?.id;
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | undefined>();

	const { result: clientEventRegistration } = useQueryOne(
		client,
		client
			.query("event_registrations")
			.where("event_id", "=", eventId)
			.where("user_id", "=", userId ?? ""),
	);

	const eventRegistration = clientEventRegistration ?? serverEventRegistration;

	const handleRegister = () => {
		if (!userId) {
			return;
		}
		setError(undefined);
		const eventRegistration: EventRegistration = {
			id: `${eventId}-${userId}`,
			league_id: leagueId,
			event_id: eventId,
			user_id: userId,
			created_at: new Date(),
			updated_at: new Date(),
			confidence_level: 1,
		};
		startTransition(async () => {
			try {
				await registerForEvent(eventRegistration);
			} catch (error) {
				// Make sure to use the error message
				setError(
					error instanceof Error
						? error.message
						: "Failed to register for event.",
				);
			}
		});
	};

	const handleUnregister = () => {
		setError(undefined);
		startTransition(async () => {
			if (eventRegistration) {
				try {
					await unregisterFromEvent(eventRegistration.id);
				} catch (error) {
					// Make sure to use the error message
					setError(
						error instanceof Error
							? error.message
							: "Failed to unregister from event.",
					);
				}
			}
		});
	};

	return (
		<>
			{eventRegistration ? (
				<Button
					className="w-full"
					onClick={handleUnregister}
					variant="destructive"
					disabled={isPending}
				>
					Unregister
				</Button>
			) : userId ? (
				<Button
					className="w-full"
					disabled={isPending}
					onClick={handleRegister}
					variant="outline"
				>
					Register
				</Button>
			) : (
				<>
					<SignInButton>
						<Button className="w-full" variant="outline">
							Sign in or sign up to Register
						</Button>
					</SignInButton>
				</>
			)}
			{error && (
				<Alert variant="destructive">
					<ExclamationTriangleIcon className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</>
	);
}
