"use client";

import { usePathname } from "next/navigation";

import { ChatList } from "@/components/ChatList";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const convoHasBeenSelected = pathname !== "/convo";
  return (
    <div className="flex items-stretch h-full">
      <div
        className={`md:basis-2/12 ${
          convoHasBeenSelected ? "hidden md:block" : "w-full"
        }`}
      >
        <ChatList />
      </div>
      <div className={`grow ${!convoHasBeenSelected && "hidden md:block"}`}>
        {children}
      </div>
    </div>
  );
}
