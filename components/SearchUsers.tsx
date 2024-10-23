import { useSession } from "@clerk/nextjs";

import {
	addUserToConversation,
	removeUserFromConversation,
} from "@/lib/triplit-mutations";
import {
	type TEnhancedConversation,
	useUsersNotInConversationList,
} from "@/hooks/triplit-hooks";

import { Button } from "./ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";

export function SearchUsers({
	open,
	setOpen,
	conversation,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
	conversation: TEnhancedConversation;
}) {
	const { session } = useSession();
	const currentUserId = session?.user?.id;
	const members = conversation?.membersInfo;
	const { nonMembers } = useUsersNotInConversationList(conversation);

	const currentUser = members.find(({ id }) => id === currentUserId);
	const membersExCurrentUser =
		members?.filter(({ id }) => id !== currentUserId) ?? [];

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput placeholder="Search users..." />
			<CommandList>
				<CommandEmpty>No users found.</CommandEmpty>
				{conversation && (
					<>
						<CommandGroup heading="Members">
							{currentUser && (
								<CommandItem value={currentUser.first_name}>
									<span>{currentUser.first_name} (me)</span>
									<Button
										size="sm"
										variant="destructive"
										className="ml-auto"
										onClick={() =>
											removeUserFromConversation(
												currentUser.id,
												conversation.id,
											)
										}
									>
										Leave
									</Button>
								</CommandItem>
							)}
							{membersExCurrentUser.map((user) => (
								<CommandItem key={user.id} value={user.first_name}>
									<span>{user.first_name}</span>
									<Button
										size="sm"
										variant="destructive"
										className="ml-auto"
										onClick={() =>
											removeUserFromConversation(user.id, conversation.id)
										}
									>
										Remove
									</Button>
								</CommandItem>
							))}
						</CommandGroup>
						{nonMembers && nonMembers.length > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup heading="Invite">
									{nonMembers.map((user) => (
										<CommandItem
											key={user.id}
											value={`${user.first_name} ${user.last_name}`}
										>
											<span>
												{user.first_name} {user.last_name} ({user.email})
											</span>
											<Button
												size="sm"
												className="ml-auto"
												onClick={() =>
													addUserToConversation(user.id, conversation.id)
												}
											>
												Add
											</Button>
										</CommandItem>
									))}
								</CommandGroup>
							</>
						)}
					</>
				)}
			</CommandList>
		</CommandDialog>
	);
}
