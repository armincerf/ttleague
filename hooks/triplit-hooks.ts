import { useMemo } from "react";
import { useInfiniteQuery, useQuery, useQueryOne } from "@triplit/react";
import { client } from "@/lib/triplit";
import type { Conversation } from "../triplit/schema";

export type TEnhancedFilteredConversations = NonNullable<
	ReturnType<typeof useFilteredConversations>["conversations"]
>;

// Populate the conversation sidebar (or full screen on mobile) and applies
// the search filter to the query results.
export function useFilteredConversations(query: string) {
	const {
		results: conversations,
		fetchingRemote,
		fetching,
		error,
	} = useQuery(
		client,
		client.query("conversations").where("name", "like", `%${query}%`),
	);
	return { conversations, fetchingRemote, fetching, error };
}

type TUseConversation = ReturnType<typeof useConversation>;

export type TEnhancedConversation = NonNullable<
	TUseConversation["conversation"]
>;

// Used to populate the <SearchUsers/> component to view the _existing_ members in
// the selected conversation. Uses `include('membersInfo')` to traverse the relation
// between conversations and users and return a full user object for each member.
export function useConversation(convoId: string) {
	const {
		result: conversation,
		fetching,
		fetchingRemote,
		error,
	} = useQueryOne(
		client,
		client.query("conversations").id(convoId).include("membersInfo"),
	);
	return { conversation, fetching, fetchingRemote, error };
}

// Populate the conversation cards on the sidebar with the last recieved message
export function useConversationSnippet(convoId: string) {
	const messagesQuery = client
		.query("messages")
		.where("conversationId", "=", convoId)
		.order("created_at", "DESC");
	const { result: message } = useQueryOne(client, messagesQuery);
	return message?.text;
}

type TUseMessage = ReturnType<typeof useMessages>;
export type TEnhancedMessage =
	| NonNullable<TUseMessage["messages"]>[number]
	| NonNullable<TUseMessage["pendingMessages"]>[number];

// Populates the <MessageList/> component with both sent and pending messages
// Uses `include('sender')` to traverse the relation between messages and users
// and return a full user object for each message's sender.
export function useMessages(convoId: string) {
	const messagesQuery = useMemo(
		() =>
			client
				.query("messages")
				.where("conversationId", "=", convoId)
				.order("created_at", "DESC")
				.limit(30)
				.include("sender")
				.include("reactions"),
		[convoId],
	);

	const deliveredMessagesQuery = useMemo(
		() => messagesQuery.syncStatus("confirmed"),
		[messagesQuery],
	);
	const pendingMessagesQuery = useMemo(
		() => messagesQuery.syncStatus("pending"),
		[messagesQuery],
	);

	const {
		results: messages,
		fetchingRemote,
		fetchingMore,
		fetching,
		error,
		hasMore,
		loadMore,
	} = useInfiniteQuery(client, deliveredMessagesQuery);

	const { results: pendingMessages } = useQuery(client, pendingMessagesQuery);

	return {
		fetchingRemote,
		fetchingMore,
		fetching,
		error,
		hasMore,
		loadMore,
		messages,
		pendingMessages: pendingMessages,
	};
}

// Used to populate the <SearchUsers/> component for adding members to a conversation
// Uses the nin operator in tandem with the conversation's members to exclude them
// from the query results
export function useUsersNotInConversationList(conversation: Conversation) {
	const {
		results: nonMembers,
		fetching,
		fetchingRemote,
		error,
	} = useQuery(
		client,
		client
			.query("users")
			.where("id", "nin", Array.from(conversation?.members ?? [])),
	);
	return { nonMembers, fetching, fetchingRemote, error };
}
