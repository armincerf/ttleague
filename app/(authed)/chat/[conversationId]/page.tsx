import { Conversation, UnauthChatView } from "@/components/Conversation";
import { auth } from "@clerk/nextjs/server";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const { userId } = await auth();
  return (
    <section className="h-full">
      {userId ? <Conversation id={conversationId} /> : <UnauthChatView />}
    </section>
  );
}
