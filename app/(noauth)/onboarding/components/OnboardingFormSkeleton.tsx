import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OnboardingFormSkeleton() {
	return (
		<Card className="w-[90vw] sm:w-full max-w-[450px] mx-auto mt-8 px-4 sm:px-0">
			<CardHeader>
				<Skeleton className="h-8 w-3/4" />
				<Skeleton className="h-4 w-5/6 mt-2" />
			</CardHeader>
			<CardContent className="space-y-6">
				{[...Array(5)].map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-10 w-full" />
					</div>
				))}
				<Skeleton className="h-10 w-full" />
			</CardContent>
		</Card>
	);
}
