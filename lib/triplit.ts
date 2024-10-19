import { schema } from "@/triplit/schema";
import { TriplitClient } from "@triplit/client";

console.log(
	"NEXT_PUBLIC_TRIPLIT_SERVER_URL",
	process.env.NEXT_PUBLIC_TRIPLIT_SERVER_URL,
);

export const client = new TriplitClient({
	serverUrl: process.env.NEXT_PUBLIC_TRIPLIT_SERVER_URL,
	schema,
});
