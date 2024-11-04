import type { TournamentState } from "@/lib/tournamentManager/hooks/useTournament";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../ui/accordion";

type StateVisualizerProps = {
	state: string;
	context: TournamentState;
	tableCount: number;
};

function formatContext(context: TournamentState) {
	const replacer = (_key: string, value: unknown) => {
		if (value instanceof Map) {
			return Object.fromEntries(value);
		}
		return value;
	};

	return JSON.stringify(context, replacer, 2);
}

export function StateVisualizer({
	state,
	context,
	tableCount,
}: StateVisualizerProps) {
	const activeMatchesCount = context.matches.filter(
		(match) => match.status === "ongoing" || match.status === "pending",
	).length;
	return (
		<div className="mb-6 p-4 bg-gray-50 rounded-lg">
			<h2 className="text-lg font-semibold mb-2">State Machine Status</h2>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<h3 className="font-medium text-gray-700">Current State:</h3>
					<code className="block p-2 bg-white rounded border">
						{JSON.stringify(state, null, 2)}
					</code>
				</div>
				<div>
					<h3 className="font-medium text-gray-700">Context Summary:</h3>
					{context && (
						<ul className="space-y-1 text-sm">
							<li>Players: {context.player_ids.size}</li>
							<li>Matches: {context.matches.length}</li>
							<li>Free Tables: {tableCount - activeMatchesCount}</li>
							<li>Total Tables: {tableCount}</li>
							<li>Total Rounds: {context.total_rounds}</li>
						</ul>
					)}
				</div>
			</div>

			<Accordion type="single" collapsible>
				<AccordionItem value="full-context">
					<AccordionTrigger>
						<h3 className="font-medium text-gray-700">Full Context</h3>
					</AccordionTrigger>
					<AccordionContent>
						<pre className="block p-2 bg-white rounded border overflow-auto max-h-96">
							<code className="text-sm">{formatContext(context)}</code>
						</pre>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}
