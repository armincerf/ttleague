import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function MatchesLoadingSkeleton() {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Event</TableHead>
					<TableHead>Player 1</TableHead>
					<TableHead>Player 2</TableHead>
					<TableHead>Score</TableHead>
					<TableHead>Action</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{Array.from({ length: 5 }).map((_, i) => (
					<TableRow key={i}>
						<TableCell>
							<Skeleton className="h-4 w-[100px]" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-[120px]" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-[120px]" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-[40px]" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-[80px]" />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export default MatchesLoadingSkeleton;
