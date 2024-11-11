"use client";
import { client } from "@/lib/triplit";
import type { schema } from "@/triplit/schema";
import { useAuth, useUser } from "@clerk/nextjs";
import type { Entity } from "@triplit/client";
import { useConnectionStatus, useEntity, useQuery } from "@triplit/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { jwtDecode } from "jwt-decode";
import { usePostHog } from "posthog-js/react";

const tokenPayloadSchema = z.object({
	azp: z.string(),
	exp: z.number(),
	iat: z.number(),
	iss: z.string(),
	jti: z.string(),
	nbf: z.number(),
	sid: z.string().optional(),
	sub: z.string(),
	type: z.union([z.literal("user"), z.literal("admin")]),
});

type TokenPayload = z.infer<typeof tokenPayloadSchema>;

function parseTokenPayload(
	token: string,
	router: ReturnType<typeof useRouter>,
	posthog: ReturnType<typeof usePostHog>,
): TokenPayload | null {
	try {
		const decoded = jwtDecode(token);
		const result = tokenPayloadSchema.safeParse(decoded);

		if (!result.success) {
			console.error("Invalid token payload:", result.error);
			return null;
		}
		setTimeout(async () => {
			let user = await client.fetchById("users", result.data.sub);
			if (!user) {
				const remoteUser = await client.fetchById("users", result.data.sub, {
					policy: "remote-first",
				});
				console.log("remoteUser", remoteUser, user, result.data.sub, client);
				if (!remoteUser) {
					console.log("No remote user, resetting client");
					//posthog.reset();
					//router.push("/onboarding");
					return;
				}
				user = remoteUser;
			}
			posthog.identify(user.id, {
				...user,
				name: `${user.first_name} ${user.last_name}`,
			});
		}, 1000);

		return result.data;
	} catch (error) {
		console.error("Failed to parse token:", error);
		return null;
	}
}

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

/**
 * Calculates the delay before a token refresh is needed, using a buffer to account for weirdness in token expiration
 * @param expirationTime - Token expiration timestamp in milliseconds
 * @returns Number of milliseconds to wait before refreshing the token, minimum 0
 */
function calculateRefreshDelay(expirationTime: number): number {
	const currentTime = Date.now();
	return Math.max(0, expirationTime - currentTime);
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
	if (token === client.token || client.syncEngine.connectionStatus === "OPEN") {
		return;
	}

	if (client.syncEngine.connectionStatus === "CLOSED") {
		client.connect();
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
	const [isOnboarding, setIsOnboarding] = useState<boolean | undefined>(
		undefined,
	);
	const [loading, setLoading] = useState(true);
	const { userId } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const { result: user } = useEntity(client, "users", userId ?? "");

	useEffect(() => {
		const timer = setTimeout(() => {
			setLoading(false);
		}, 1000);
		return () => clearTimeout(timer);
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

		const missingFields = requiredOnboardingFields.some(
			(field) => !user?.[field],
		);
		setIsOnboarding(missingFields);

		if (missingFields) {
			router.push("/onboarding");
		}
	}, [router, pathname, user, loading, userId]);

	return { isOnboarding: loading ? undefined : isOnboarding };
}

export function useTokenCheck() {
	const { getToken } = useAuth();

	useEffect(() => {
		const timer = setTimeout(() => {
			if (client.syncEngine.connectionStatus !== "OPEN") {
				client.reset();
				const connectTimer = setTimeout(() => {
					client.connect();
				}, 1000);
				return () => clearTimeout(connectTimer);
			}
		}, 10000);
		return () => clearTimeout(timer);
	}, []);

	const router = useRouter();
	const posthog = usePostHog();
	useEffect(() => {
		let cleanup: TokenCleanup;
		async function refreshToken() {
			const token = await getToken({ template: "Triplit" });
			await updateClientToken(token ?? process.env.NEXT_PUBLIC_TRIPLIT_TOKEN);
			const parsedToken = parseTokenPayload(token ?? "", router, posthog);
			console.log("parsedToken", parsedToken);

			if (token) {
				cleanup?.();
				cleanup = setupTokenRefreshTimer(token, refreshToken);
			}
		}

		refreshToken();

		return () => {
			cleanup?.();
		};
	}, [getToken, router, posthog]);
}
