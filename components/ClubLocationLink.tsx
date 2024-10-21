import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

interface Club {
	id: string;
	name: string;
	latitude: number;
	longitude: number;
}

function ClubLocationLink({
	club,
	iconClassName,
	textClassName,
}: { club: Club; iconClassName?: string; textClassName?: string }) {
	return (
		<div className="flex items-center">
			<MapPin
				className={cn("w-4 h-4 mr-2 text-muted-foreground", iconClassName)}
			/>
			<Link
				href={`https://www.google.com/maps/search/?api=1&query=${club.latitude},${club.longitude}`}
				target="_blank"
				rel="noopener noreferrer"
				className={cn("text-sm", textClassName)}
			>
				{club.name}
			</Link>
		</div>
	);
}

export default ClubLocationLink;
