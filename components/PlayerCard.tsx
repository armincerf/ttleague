"use client";

interface PlayerCardProps {
	name: string;
	avatar?: string;
}

export function PlayerCard({ name, avatar }: PlayerCardProps) {
	return (
		<div className="bg-white rounded-lg px-2 py-4">
			<div className="flex items-center justify-between">
				<div className="flex flex-row items-center space-x-2">
					<div className="font-semibold">{name}</div>
				</div>
				{avatar && (
					<img src={avatar} alt={name} className="w-5 h-5 rounded-full" />
				)}
			</div>
		</div>
	);
}
