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
} from "./ui/command";

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
			<CommandInput placeholder="Search for a user" />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				{conversation ? (
					<>
						<CommandGroup heading="Members">
							{currentUser && (
								<CommandItem className="gap-4 justify-between">
									<div className="flex flex-row gap-4 ml-2">
										{currentUser.first_name} (me)
									</div>

									<Button
										size="sm"
										className="h-auto px-2 py-1"
										variant="destructive"
										onClick={() => {
											removeUserFromConversation(
												currentUser.id,
												conversation.id,
											);
										}}
									>
										Leave
									</Button>
								</CommandItem>
							)}
							{membersExCurrentUser
								?.filter(({ id }) => id !== currentUserId)
								.map((user) => (
									<CommandItem className="gap-4 justify-between" key={user.id}>
										<div className="flex flex-row gap-4 ml-2">
											{user.first_name}
										</div>
										<Button
											size="sm"
											className="h-auto px-2 py-1"
											variant="destructive"
											onClick={() => {
												removeUserFromConversation(user.id, conversation.id);
											}}
										>
											Remove
										</Button>
									</CommandItem>
								))}
						</CommandGroup>
						{nonMembers && nonMembers.length > 0 && (
							<CommandGroup heading="Invite">
								{nonMembers.map((user) => (
									<CommandItem
										className="gap-4 justify-between p-2"
										key={user.id}
									>
										<div className="flex flex-row gap-4 ml-2">
											{user.first_name} {user.last_name} ({user.email})
										</div>
										<Button
											size="sm"
											className="h-auto px-2 py-1"
											onClick={() => {
												addUserToConversation(user.id, conversation.id);
											}}
										>
											Add
										</Button>
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</>
				) : (
					<CommandEmpty>No results found.</CommandEmpty>
				)}
			</CommandList>
		</CommandDialog>
	);
}
