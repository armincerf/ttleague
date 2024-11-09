interface CurrentStatusProps {
	role: "playing" | "umpiring" | "waiting";
}

export function CurrentStatus({ role }: CurrentStatusProps) {
	const statusMessages = {
		playing: "You're up! Head to your assigned table",
		umpiring: "You're umpiring the next match",
		waiting: "Take a break - we'll notify you when your next match is ready",
	};

	const statusColors = {
		playing: "bg-green-500",
		umpiring: "bg-blue-500",
		waiting: "bg-gray-500",
	};

	return (
		<div
			className={`${statusColors[role]} text-white p-4 rounded-lg shadow-md`}
		>
			<h2 className="text-lg font-semibold">Current Status</h2>
			<p>{statusMessages[role]}</p>
		</div>
	);
}
