interface UmpireAssignmentProps {
	assignment: {
		table: number;
		players: Array<{ name: string }>;
	};
}

export function UmpireAssignment({ assignment }: UmpireAssignmentProps) {
	return (
		<div className="border rounded-lg p-4 bg-blue-50">
			<h3 className="font-semibold text-blue-800 mb-2">Umpire Assignment</h3>
			<p className="text-sm mb-1">Table {assignment.table}</p>
			<p className="text-sm text-gray-600">
				{assignment.players[0].name} vs {assignment.players[1].name}
			</p>
		</div>
	);
}
