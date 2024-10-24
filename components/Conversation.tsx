"use client";

import {
	type ChangeEvent,
	Fragment,
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useConnectionStatus } from "@triplit/react";
import {
	CheckCircle,
	CircleIcon,
	CloudOff,
	EyeIcon,
	SendIcon,
	Users,
} from "lucide-react";

import { client } from "@/lib/triplit";
import { cn } from "@/lib/utils";
import {
	type TEnhancedMessage,
	useConversation,
	useMessages,
} from "@/hooks/triplit-hooks";

import { SearchUsers } from "./SearchUsers";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "./ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function UnauthChatView() {
	const router = useRouter();

	return (
		<div className="flex items-center justify-center h-full">
			<Button
				size="lg"
				variant="outline"
				onClick={() => router.push("/sign-up")}
			>
				Login to see your chats
			</Button>
		</div>
	);
}

export function Conversation({ id, userId }: { id: string; userId: string }) {
	return (
		<div className="flex h-full flex-col items-stretch overflow-hidden">
			<ConversationHeader convoId={id} />
			<MessageList convoId={id} userId={userId} />
		</div>
	);
}

function ConversationHeader({ convoId }: { convoId: string }) {
	const { conversation } = useConversation(convoId);
	const connectionStatus = useConnectionStatus(client);
	const [memberModalOpen, setMemberModalOpen] = useState(false);

	return (
		<div className="border-b p-3 text-lg">
			<div className="flex items-center  justify-between gap-1">
				<div className="text-2xl">{conversation?.name}</div>
				{!connectionStatus ||
					(connectionStatus === "CLOSED" && (
						<div className=" border px-3 py-2 rounded-full text-sm flex gap-2 items-center">
							<CloudOff className="w-3.5 h-3.5" /> Offline
						</div>
					))}
				<Button
					size="icon"
					variant="outline"
					onClick={() => {
						setMemberModalOpen((prev) => !prev);
					}}
				>
					<Users className="w-5 h-5" />
				</Button>
			</div>
			{conversation && (
				<SearchUsers
					conversation={conversation}
					open={memberModalOpen}
					setOpen={setMemberModalOpen}
				/>
			)}
		</div>
	);
}

function MessageInput({
	convoId,
	userId,
	scrollRef,
}: {
	convoId: string;
	userId: string;
	scrollRef: RefObject<HTMLSpanElement>;
}) {
	const [draftMsg, setDraftMsg] = useState("");

	return (
		<div className="border-t">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					client
						.insert("messages", {
							conversationId: convoId,
							text: draftMsg,
							sender_id: userId,
						})
						.then(() => {
							setDraftMsg("");
						});
					setTimeout(() => {
						scrollRef.current?.scrollIntoView({ behavior: "smooth" });
					}, 0);
				}}
				className="flex flex-col gap-2 p-5"
			>
				<div className="flex items-center gap-2">
					<Input
						value={draftMsg}
						onChange={(e: ChangeEvent<HTMLInputElement>) => {
							setDraftMsg(e.target.value);
						}}
						placeholder="Type your message"
					/>
					<Button
						type="submit"
						size="icon"
						className="h-10"
						disabled={draftMsg.length === 0}
					>
						<SendIcon className="h-5 w-5" />
					</Button>
				</div>
			</form>
		</div>
	);
}

function MessageList({ convoId, userId }: { convoId: string; userId: string }) {
	const {
		messages,
		pendingMessages,
		error: messagesError,
		fetching: isFetchingMessages,
		fetchingMore,
		hasMore,
		loadMore,
	} = useMessages(convoId);

	const scroll = useRef<HTMLSpanElement>(null);
	const messagesConainerRef = useRef<HTMLDivElement>(null);
	const onScroll = useCallback(() => {
		// using flex-col-reverse, so slightly different logic
		// otherwise scrollTop === 0 would be the condition
		const atEnd =
			messagesConainerRef.current &&
			messagesConainerRef.current.scrollTop +
				messagesConainerRef.current.scrollHeight ===
				messagesConainerRef.current.clientHeight;
		if (atEnd && !fetchingMore && hasMore) {
			loadMore();
		}
	}, [hasMore, fetchingMore, loadMore]);

	return (
		<>
			<div
				className="flex grow flex-col-reverse gap-2 overflow-auto px-6 py-3 relative"
				ref={messagesConainerRef}
				onScroll={onScroll}
			>
				<span ref={scroll} />
				{pendingMessages?.map((message, index) => (
					<ChatBubble
						key={message.id}
						message={message}
						delivered={false}
						isOwnMessage={true}
						showSentIndicator={index === 0}
						userId={userId}
					/>
				))}
				{isFetchingMessages && !messages ? (
					<div>Loading...</div>
				) : messagesError ? (
					<div>
						<h4>Could not load messages</h4>
						<p>Error: {messagesError.message}</p>
					</div>
				) : (
					messages
						?.filter((message) => message.sender_id !== "system")
						.map((message, index) => {
							const isOwnMessage = message.sender_id === userId;
							const isFirstMessageInABlockFromThisDay =
								index === messages.length - 1 ||
								new Date(
									messages[index + 1]?.created_at,
								).toLocaleDateString() !==
									new Date(message.created_at).toLocaleDateString();
							return (
								<Fragment key={message.id}>
									<ChatBubble
										message={message}
										delivered={true}
										isOwnMessage={isOwnMessage}
										showSentIndicator={index === 0}
										userId={userId}
									/>
									{isFirstMessageInABlockFromThisDay && (
										<div
											className="text-center text-sm text-muted-foreground"
											key={message.created_at}
										>
											{new Date(message.created_at).toLocaleDateString([], {
												weekday: "long",
												month: "long",
												day: "numeric",
											})}
										</div>
									)}
								</Fragment>
							);
						})
				)}
			</div>
			<MessageInput convoId={convoId} scrollRef={scroll} userId={userId} />
		</>
	);
}

function toggleReaction(message: TEnhancedMessage, userId: string) {
	const usersExistingReactionId = Array.from(message?.reactions?.values()).find(
		(reaction) => reaction.userId === userId,
	)?.id;
	if (usersExistingReactionId) {
		client.delete("reactions", usersExistingReactionId);
	} else {
		client.insert("reactions", {
			messageId: message.id,
			userId,
			emoji: "👍",
		});
	}
}

function ChatBubble({
	message,
	delivered,
	isOwnMessage,
	showSentIndicator,
	userId,
}: {
	message: TEnhancedMessage;
	delivered: boolean;
	isOwnMessage: boolean;
	showSentIndicator?: boolean;
	userId: string;
}) {
	const extractImageUrls = (text: string) => {
		const urlRegex =
			/(https?:\/\/[^\s]+(?:\.jpeg|\.jpg|\.gif|\.png|\.webp|\.gif))/g;
		return text.match(urlRegex) || [];
	};

	const imageUrls = extractImageUrls(message.text);
	const textWithoutImages = message.text.replace(
		/(https?:\/\/[^\s]+(?:\.jpeg|\.jpg|\.gif|\.png|\.webp|\.gif))/g,
		"",
	);

	const [api, setApi] = useState<CarouselApi>();
	const [current, setCurrent] = useState(0);
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (!api) {
			return;
		}

		setCount(api.scrollSnapList().length);
		setCurrent(api.selectedScrollSnap() + 1);

		api.on("select", () => {
			setCurrent(api.selectedScrollSnap() + 1);
		});
	}, [api]);

	return (
		<div className="flex flex-col gap-1">
			<div
				className={cn("max-w-[85%] md:max-w-[65%]", isOwnMessage && "self-end")}
			>
				<div
					className={cn(
						"text-secondary-foreground rounded-lg px-4 py-3 flex flex-col gap-1 w-full",
						delivered ? "bg-secondary" : "border border-dashed",
						isOwnMessage && "items-end",
					)}
					onDoubleClick={() => {
						userId && toggleReaction(message, userId);
					}}
					style={{ cursor: "pointer" }}
				>
					{!isOwnMessage && (
						<div className="text-sm font-bold">
							{message.sender?.first_name}
						</div>
					)}
					<div
						className={cn(
							"flex flex-col items-center max-w-24 sm:max-w-xs",
							imageUrls.length > 1 && "mx-12",
						)}
					>
						{imageUrls.length > 1 ? (
							<>
								<Carousel setApi={setApi} className="w-full">
									<CarouselContent>
										{imageUrls.map((url, index) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											<CarouselItem key={url + index}>
												<img
													src={url}
													alt={`User uploaded content ${index + 1}`}
													className="object-contain max-w-full max-h-64"
												/>
											</CarouselItem>
										))}
									</CarouselContent>
									<CarouselPrevious />
									<CarouselNext />
								</Carousel>
								<div className="py-2 text-center text-sm text-muted-foreground">
									Image {current} of {count}
								</div>
							</>
						) : (
							imageUrls.length === 1 && (
								<img
									src={imageUrls[0]}
									alt="User uploaded content"
									className="object-contain max-w-full max-h-64 mx-auto"
								/>
							)
						)}
					</div>
					{textWithoutImages.trim() && (
						<div className="prose prose-sm dark:prose-invert w-full break-words">
							<ReactMarkdown remarkPlugins={[remarkGfm]}>
								{textWithoutImages}
							</ReactMarkdown>
						</div>
					)}
					<div className="text-xs text-muted-foregrounopenMemberModal">
						{new Date(message.created_at).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
							hour12: true,
						})}
					</div>
				</div>
				{showSentIndicator && isOwnMessage && (
					<SentIndicator delivered={delivered} />
				)}
			</div>
			<div className={cn("flex flex-row gap-1", isOwnMessage && "self-end")}>
				{Object.entries(
					message.reactions?.reduce(
						(prev, reaction) => {
							prev[reaction.emoji] = (prev[reaction.emoji] || 0) + 1;
							return prev;
						},
						{} as Record<string, number>,
					),
				).map(([reaction, count]) => (
					<div
						key={reaction}
						className="flex flex-row gap-1 items-center rounded-lg px-2 py-0.5 text-sm"
					>
						{reaction}
						<span className="text-muted-foreground">{count}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function SentIndicator({ delivered }: { delivered: boolean }) {
	return (
		<div className="flex flex-row items-center gap-1 text-xs justify-end p-2">
			{delivered ? (
				<>
					<CheckCircle size={12} />
					Sent
				</>
			) : (
				<>
					<CircleIcon size={12} /> Pending
				</>
			)}
		</div>
	);
}
