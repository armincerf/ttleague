import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

interface Club {
	id: string;
	name: string;
	latitude: number;
	longitude: number;
	mapsLink?: string;
}

export function ClubLocationLinkComponent({
	club,
	className,
}: { club: Club; className?: string }) {
	return (
		<Link
			href={
				club.mapsLink ??
				`https://www.google.com/maps/search/?api=1&query=${club.latitude},${club.longitude}`
			}
			className={className}
			target="_blank"
			rel="noopener noreferrer"
		>
			{club.name}
		</Link>
	);
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
			<ClubLocationLinkComponent club={club} />
		</div>
	);
}

export default ClubLocationLink;
