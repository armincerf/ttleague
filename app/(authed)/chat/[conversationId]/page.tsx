import { Conversation, UnauthChatView } from "@/components/Conversation";
import { auth } from "@clerk/nextjs/server";
import { unstable_cacheLife as cacheLife } from "next/cache";
export default async function ConversationPage({
	params,
}: {
	params: Promise<{ conversationId: string }>;
}) {
	"use cache";
	cacheLife("seconds");

	const { userId } = await auth();
	const { conversationId } = await params;
	return (
		<section className="h-full">
			{userId && conversationId ? (
				<Conversation id={conversationId.toString()} userId={userId} />
			) : (
				<UnauthChatView />
			)}
		</section>
	);
}
