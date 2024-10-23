import { useConnectionStatus } from "@triplit/react";
import { useSession } from "@clerk/nextjs";
import { client } from "@/lib/triplit";

export function ConnectionStatus({}: {}) {
  const status = useConnectionStatus(client);
  const { session } = useSession();
  if (!status) return null;
  const color =
    status === "CLOSING" || status === "CLOSED"
      ? "bg-red-500"
      : status === "CONNECTING"
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className={`flex flex-row px-4 py-2 gap-2 items-center text-sm`}>
      <div className={`h-3 w-3 rounded-full ${color}`} />
      {session?.user?.fullName}
    </div>
  );
}
