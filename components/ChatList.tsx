"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, PenBox } from "lucide-react";
import { useSession } from "@clerk/nextjs";

import { addConversation } from "@/lib/triplit-mutations";
import { cn } from "@/lib/utils";
import {
  useConversationSnippet,
  useFilteredConversations,
} from "@/hooks/triplit-hooks";
import { useSelectedConvo } from "@/hooks/use-selected-convo";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "./ConnectionStatus";
import { DropdownMenu, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Modal } from "./ui/modal";
import { Skeleton } from "./ui/skeleton";

export function ChatList() {
  const { session } = useSession();
  const currentUserId = session?.user?.id;
  const selectedChat = useSelectedConvo();
  const [chatFilter, setChatFilter] = useState("");
  const [createConvoModalOpen, setCreateConvoModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const { conversations, fetchingRemote, fetching, error } =
    useFilteredConversations(chatFilter);
  const router = useRouter();

  if (error) {
    return (
      <div>
        <h4>Could not load conversations</h4>
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <>
      <Modal open={createConvoModalOpen} onOpenChange={setCreateConvoModalOpen}>
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!currentUserId) {
              console.error(
                "Could not create conversation: no current user id"
              );
              return;
            }
            const conversation = await addConversation(
              draftName,
              currentUserId
            );
            setDraftName("");
            setCreateConvoModalOpen(false);
            router.replace(`/convo/${conversation?.id}`);
          }}
        >
          Create new conversation
          <div className="text-sm text-muted-foreground">Conversation name</div>
          <Input
            value={draftName}
            placeholder="e.g. Coding Buddies"
            type="text"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setDraftName(e.target.value)
            }
          />
          <div className="flex flex-row gap-3 self-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateConvoModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!draftName}>
              Submit
            </Button>
          </div>
        </form>
      </Modal>
      <div className="bg-secondary h-full flex flex-col">
        <div className="w-full p-2">
          <UserDropdownMenu />
        </div>

        <div className="flex items-center justify-between px-5 py-2">
          <h2 className="text-xl flex flex-row items-center gap-2">
            Chats
            {fetchingRemote && <Loader2 className="h-4 w-4 animate-spin" />}
          </h2>

          <Button
            variant="default"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setCreateConvoModalOpen(true);
            }}
          >
            <PenBox className="h-4 w-4" />
          </Button>
        </div>

        <Input
          type="search"
          className="w-auto mx-3 my-2"
          placeholder="🔍  Search chats"
          value={chatFilter}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setChatFilter(e.target.value);
          }}
        />

        <div className="flex flex-col p-3">
          {fetching && (
            <>
              <ConvoSkeleton />
              <ConvoSkeleton />
              <ConvoSkeleton />
              <ConvoSkeleton />
            </>
          )}
          {conversations?.map((conversation) => (
            <ConvoListItem
              key={conversation.id}
              convo={conversation}
              isSelected={conversation.id === selectedChat}
            />
          ))}
          {!(fetching && fetchingRemote) && conversations?.length === 0 && (
            <div className="text-muted-foreground text-sm mx-auto">
              {chatFilter ? "No results" : "No chats"}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ConvoListItem({
  convo,
  isSelected,
}: {
  convo: any;
  isSelected: boolean;
}) {
  const messageSnippet = useConversationSnippet(convo.id);
  return (
    <Link
      href={`/convo/${convo.id}`}
      className={cn(
        "flex items-center gap-3 rounded px-3 py-2",
        isSelected && "bg-primary/20"
      )}
    >
      <div>
        <div className="font-bold">{convo.name}</div>
        <div className="italic">{messageSnippet ?? "No messages yet"}</div>
      </div>
    </Link>
  );
}

function ConvoSkeleton() {
  return (
    <div className="flex flex-row items-center gap-3 rounded p-2 mb-3">
      <Skeleton className="h-10 w-10 rounded" />
      <div className="flex flex-col grow gap-2">
        <Skeleton className="h-[1rem]" />
        <Skeleton className="h-[1rem]" />
      </div>
    </div>
  );
}

function UserDropdownMenu() {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={"outline"} className="w-full">
          <ConnectionStatus />
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
    </DropdownMenu>
  );
}