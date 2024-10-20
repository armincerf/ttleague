import { schema } from "@/triplit/schema";
import { TriplitClient } from "@triplit/client";

console.log(
	"NEXT_PUBLIC_TRIPLIT_SERVER_URL",
	process.env.NEXT_PUBLIC_TRIPLIT_SERVER_URL,
	process.env.NEXT_PUBLIC_TRIPLIT_TOKEN,
);

export const client = new TriplitClient({
	serverUrl: process.env.NEXT_PUBLIC_TRIPLIT_SERVER_URL,
	token: process.env.NEXT_PUBLIC_TRIPLIT_TOKEN,
	schema,
});

export async function checkAccountExists(email: string) {
	if (!process.env.NEXT_PUBLIC_TRIPLIT_SERVER_URL) {
		throw new Error("NEXT_PUBLIC_TRIPLIT_SERVER_URL is not defined");
	}
	if (!process.env.NEXT_PUBLIC_TRIPLIT_TOKEN) {
		throw new Error("NEXT_PUBLIC_TRIPLIT_TOKEN is not defined");
	}

	const res = await client.http.fetchOne(
		client.query("users").where("email", "=", email).build(),
	);
	return res !== null;
}
