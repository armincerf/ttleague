import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export default function RegisteredPlayers({
	players,
}: {
	players: Array<{ name: string; avatarUrl: string }>;
}) {
	if (players.length < 3) return null;

	return (
		<div className="mt-6 relative overflow-hidden rounded-lg p-6 bg-gradient-to-br from-tt-blue/10 to-primary/10">
			<div className="absolute opacity-50 inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_25%,rgba(68,68,68,.2)_50%,transparent_50%,transparent_75%,rgba(68,68,68,.2)_75%)] bg-[length:6px_6px]" />

			<h3 className="font-semibold mb-2 relative">Already Registered</h3>
			<div className="flex flex-col gap-4 relative">
				<TooltipProvider>
					<div className="flex -space-x-2 hover:space-x-1 transition-all duration-300">
						{players.map((player) => (
							<Tooltip key={player.name}>
								<TooltipTrigger>
									<Avatar className="border-2 border-background hover:scale-110 transition-transform duration-300">
										<AvatarImage src={player.avatarUrl} alt={player.name} />
										<AvatarFallback>{player.name.slice(0, 2)}</AvatarFallback>
									</Avatar>
								</TooltipTrigger>
								<TooltipContent>{player.name}</TooltipContent>
							</Tooltip>
						))}
					</div>
				</TooltipProvider>
			</div>
		</div>
	);
}
