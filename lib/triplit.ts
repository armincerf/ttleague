import { schema } from "@/triplit/schema";
import { TriplitClient } from "@triplit/client";

export const client = new TriplitClient({
	serverUrl: process.env.NEXT_PUBLIC_TRIPLIT_SERVER_URL,
	token: process.env.NEXT_PUBLIC_TRIPLIT_TOKEN,
	schema,
});

setTimeout(() => {
	client
		.fetch(
			client
				.query("users")
				.include("matches")
				.build(),
				{policy: "remote-only"}
		)
		.then((res) => {
			console.log("sybnced");
		});
}, 1000);
