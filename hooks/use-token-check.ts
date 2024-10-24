import { client } from "@/lib/triplit";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
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

async function updateClientToken(token: string | undefined) {
	if (token === client.token) {
		return;
	}

	client.disconnect();
	client.updateToken(token ?? "");

	if (!token) {
		await client.reset();
		return;
	}

	client.connect();
}

export function useTokenCheck() {
	const { getToken } = useAuth();

	useEffect(() => {
		let cleanup: TokenCleanup;

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
