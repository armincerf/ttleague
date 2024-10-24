import { useConnectionStatus } from "@triplit/react";
import { useSession } from "@clerk/nextjs";
import { client } from "@/lib/triplit";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export function ConnectionStatus({ showUser = true }: { showUser?: boolean }) {
	const status = useConnectionStatus(client);
	const { session } = useSession();
	if (!status) return null;

	const color =
		status === "CLOSING" || status === "CLOSED"
			? "bg-red-500"
			: status === "CONNECTING"
				? "bg-yellow-500"
				: "bg-green-500";

	const statusMessage =
		status === "CLOSING" || status === "CLOSED"
			? "No connection"
			: status === "CONNECTING"
				? "Connecting..."
				: "Connected";

	return (
		<div className={"flex flex-row px-4 py-2 gap-2 items-center text-sm"}>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<div className={`h-3 w-3 rounded-full ${color}`} />
					</TooltipTrigger>
					<TooltipContent className={`${color} text-white border-none`}>
						<p>{statusMessage}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			{showUser && session?.user?.fullName}
		</div>
	);
}
