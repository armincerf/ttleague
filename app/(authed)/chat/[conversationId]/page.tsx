import { Conversation, UnauthChatView } from "@/components/Conversation";
import { auth } from "@clerk/nextjs/server";

export const runtime = "edge";

export default async function ConversationPage({
	params,
}: {
	params: Promise<{ conversationId: string }>;
}) {
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
