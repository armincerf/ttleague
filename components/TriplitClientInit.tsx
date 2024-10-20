"use client";

import { client } from "@/lib/triplit";
import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import posthog from "posthog-js";

export default function TriplitClientInit() {
	const { getToken, isSignedIn, userId } = useAuth();

	useEffect(() => {
		async function initializeClient() {
			const token = await getToken();
			console.log("TriplitClientInit", token);
			if (client && client.connectionStatus !== "OPEN" && token) {
				console.log("Updating token", token, client.token);
				client.disconnect();
				client.updateToken(token);
				if (isSignedIn && userId) {
					posthog.identify(userId);
				}
				console.log("Token updated", client.token);
				client.connect();
			}
		}
		initializeClient();
	}, [getToken]);

	return null;
}
