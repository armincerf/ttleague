"use client";

import { client } from "@/lib/triplit";
import { useEffect } from "react";
export default function TriplitClientInit({ token }: { token: string }) {
	useEffect(() => {
		console.log("TriplitClientInit", token);
		if (client && client.connectionStatus !== "OPEN") {
			console.log("Updating token", token, client.token);
			client.disconnect();
			client.updateToken(token);
			console.log("Token updated", client.token);
			client.connect();
		}
	}, [token]);
	return null;
}
