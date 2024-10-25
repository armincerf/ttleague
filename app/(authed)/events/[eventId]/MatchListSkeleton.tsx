import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function MatchListSkeleton() {
	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<Skeleton className="h-4 w-20" />
						</TableHead>
						<TableHead>
							<Skeleton className="h-4 w-20" />
						</TableHead>
						<TableHead>
							<Skeleton className="h-4 w-24" />
						</TableHead>
						<TableHead>
							<Skeleton className="h-4 w-20" />
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{[...Array(3)].map((_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<TableRow key={index}>
							<TableCell>
								<Skeleton className="h-4 w-24" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-24" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-16" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-20" />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</>
	);
}

export default MatchListSkeleton;
