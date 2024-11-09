import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingEventCard() {
	return (
		<Card className="mb-4">
			<CardContent className="pt-6">
				<Skeleton className="h-6 w-3/4 mb-2" />
				<Skeleton className="h-4 w-1/2 mb-2" />
				<Skeleton className="h-4 w-24" />
			</CardContent>
		</Card>
	);
}

export default function Loading() {
	return (
		<section className="mb-8">
			<Skeleton className="h-8 w-40 mb-4" />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 3 }).map((_, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					<LoadingEventCard key={index} />
				))}
			</div>
		</section>
	);
}
