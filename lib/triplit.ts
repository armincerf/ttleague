import { schema } from "@/triplit/schema";
import { TriplitClient } from "@triplit/client";

export const client = new TriplitClient({
	serverUrl: process.env.NEXT_PUBLIC_TRIPLIT_SERVER_URL,
	token: process.env.NEXT_PUBLIC_TRIPLIT_TOKEN,
	schema,
});

setTimeout(() => {
	client
		.fetch(client.query("users").build(), { policy: "remote-only" })
		.then((res) => {
			console.log("synced");
		});
}, 1000);
