import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { MessageCircle } from "lucide-react";
import { Suspense } from "react";

async function ChatInner() {
	const { userId } = await auth();
	if (!userId) {
		return (
			<div className="flex max-w-[980px] w-full h-screen flex-col items-center justify-center text-muted-foreground gap-2 p-10">
				<SignInButton />
			</div>
		);
	}
	return (
		<section className="grow">
			<div className="flex max-w-[980px] w-full h-screen flex-col items-center justify-center text-muted-foreground gap-2 p-10">
				<div className="flex flex-row gap-2">
					<MessageCircle className="w-5 h-5" />
					No conversation selected
				</div>
			</div>
		</section>
	);
}

export default async function ChatPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ChatInner />
		</Suspense>
	);
}
