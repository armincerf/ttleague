"use client";
import { client } from "@/lib/triplit";
import type { schema } from "@/triplit/schema";
import { useAuth, useUser } from "@clerk/nextjs";
import type { Entity } from "@triplit/client";
import { useConnectionStatus, useEntity, useQuery } from "@triplit/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";

const TOKEN_BUFFER_MS = 60_000; // 1 minute buffer

const tokenPayloadSchema = z.object({
	exp: z.number(),
});

type TokenCleanup = () => void;

function parseJwtExpiration(token: string): number {
	try {
		const [, base64Payload] = token.split(".");
		const payload = JSON.parse(atob(base64Payload));
		const result = tokenPayloadSchema.safeParse(payload);

		if (!result.success) {
			return 0;
		}

		return result.data.exp * 1000; // Convert to milliseconds
	} catch {
		return 0;
	}
}

function calculateRefreshDelay(expirationTime: number): number {
	const currentTime = Date.now();
	return Math.max(0, expirationTime - currentTime - TOKEN_BUFFER_MS);
}

function setupTokenRefreshTimer(
	token: string,
	onRefreshNeeded: () => Promise<void>,
): TokenCleanup {
	const expirationTime = parseJwtExpiration(token);
	const delay = calculateRefreshDelay(expirationTime);

	const timeoutId = setTimeout(onRefreshNeeded, delay);
	return () => clearTimeout(timeoutId);
}

async function resetClient() {
	client.disconnect();
	await client.reset();
	window.location.reload();
}

async function updateClientToken(token: string | undefined) {
	if (token === client.token) {
		return;
	}

	try {
		client.disconnect();
		client.updateToken(token ?? "");

		if (!token) {
			await client.reset();
			return;
		}

		client.connect();
		setTimeout(async () => {
			if (client.syncEngine.connectionStatus === "CLOSED") {
				console.log("Connection closed, resetting", client.syncEngine);
				resetClient();
			}
		}, 1000);
	} catch (error) {
		console.error("Failed to connect to Triplit", error);
	}
}

const requiredOnboardingFields: (keyof Entity<typeof schema, "users">)[] = [
	"first_name",
	"last_name",
	"current_division",
];

function getLocalStorageKey(actionId: string): string {
	return `admin_action_${actionId}`;
}

export function useAdminActionListener() {
	const { user } = useUser();
	const userId = user?.id || "anon";
	const { results: actions } = useQuery(client, client.query("admin_actions"));

	useEffect(() => {
		if (!actions?.length) {
			return;
		}

		for (const action of actions) {
			setTimeout(async () => {
				if (!action) return;

				// Check localStorage first
				const localStorageKey = getLocalStorageKey(action.id);
				const isLocallyAcknowledged =
					localStorage.getItem(localStorageKey) === userId;

				if (
					isLocallyAcknowledged ||
					(userId && action.acknowledged?.has(userId))
				) {
					return;
				}

				if (action.user_id && action.user_id !== userId) {
					console.log("action with wrong user", action);
				} else {
					console.log("action", action);
					if (action.action === "reset_client") {
						console.log("resetting client", action, userId);
						client
							.update("admin_actions", action.id, (entity) => {
								if (!entity.acknowledged) {
									entity.acknowledged = new Set([userId]);
								} else {
									entity.acknowledged.add(userId);
								}
							})
							.then(async (e) => {
								const tx = e.txId;
								if (!tx) return;

								// Store acknowledgment in localStorage
								localStorage.setItem(localStorageKey, userId);

								client.syncEngine.onTxCommit(tx, () => {
									resetClient();
								});
							})
							.catch((error) => {
								console.error("Failed to acknowledge action", error);
							});
					}
				}
			}, 1000);
		}
	}, [actions, userId]);
}

export function useCheckForOnboarding() {
	const [isOnboarding, setIsOnboarding] = useState(false);
	const { userId } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const { result: user } = useEntity(client, "users", userId ?? "");
	const [loading, setLoading] = useState(true);
	useAdminActionListener();

	useEffect(() => {
		setTimeout(() => {
			setLoading(false);
		}, 1000);
	}, []);

	useEffect(() => {
		if (
			pathname.includes("/onboarding") ||
			loading ||
			client.syncEngine.connectionStatus !== "OPEN" ||
			!userId
		) {
			return;
		}

		console.log("user", user);
		const missingFields = requiredOnboardingFields.some(
			(field) => !user?.[field],
		);
		setIsOnboarding(missingFields);
		console.log("missingFields", missingFields, user);

		if (missingFields) {
			router.push("/onboarding");
		}
	}, [router, pathname, user, loading, userId]);

	return { isOnboarding };
}

export function useTokenCheck() {
	const { getToken } = useAuth();

	useEffect(() => {
		setTimeout(() => {
			if (client.syncEngine.connectionStatus !== "OPEN") {
				client.reset();
				setTimeout(() => {
					client.connect();
				}, 1000);
			}
		}, 10000);
	}, []);

	useEffect(() => {
		let cleanup: TokenCleanup;
		if (process.env.NODE_ENV !== "development") {
			return;
		}

		async function refreshToken() {
			const token = await getToken();
			await updateClientToken(token ?? process.env.NEXT_PUBLIC_TRIPLIT_TOKEN);

			if (token) {
				cleanup = setupTokenRefreshTimer(token, refreshToken);
			}
		}

		refreshToken();

		return () => {
			cleanup?.();
		};
	}, [getToken]);
}
