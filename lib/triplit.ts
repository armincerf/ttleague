import { schema } from "@/triplit/schema";
import { TriplitClient } from "@triplit/client";

export const client = new TriplitClient({
	serverUrl: process.env.NEXT_PUBLIC_TRIPLIT_SERVER_URL,
	token: process.env.NEXT_PUBLIC_TRIPLIT_TOKEN,

	storage: typeof window !== "undefined" ? "indexeddb" : "memory",
	clientId: new Date().toISOString().slice(0, 10),
	schema,
});
