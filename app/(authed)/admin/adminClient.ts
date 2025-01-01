import { schema } from "@/triplit/schema";
import { TriplitClient } from "@triplit/client";

export const client = new TriplitClient({
	schema,
	token: process.env.NEXT_PUBLIC_TRIPLIT_TOKEN,
	serverUrl: process.env.NEXT_PUBLIC_TRIPLIT_SERVER_URL,
});
