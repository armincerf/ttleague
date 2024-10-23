import { Conversation } from "@/components/Conversation";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return (
    <section className="h-full">
      <Conversation id={conversationId} />
    </section>
  );
}
