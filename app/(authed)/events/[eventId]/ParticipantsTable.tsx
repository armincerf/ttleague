"use client";

import { useQuery } from "@triplit/react";
import { useSearchParams } from "next/navigation";
import { client } from "@/lib/triplit";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	getDivision,
	leagueDivisionsSchema,
	type LeagueDivision,
} from "@/lib/ratingSystem";

interface ParticipantsTableProps {
	eventId: string;
}

export default function ParticipantsTable({ eventId }: ParticipantsTableProps) {
	const searchParams = useSearchParams();
	const minLevel = searchParams.get("minLevel") as LeagueDivision | null;
	const maxLevel = searchParams.get("maxLevel") as LeagueDivision | null;

	const query = client
		.query("event_registrations")
		.where("event_id", "=", eventId)
		.include("user")
		.build();

	const { results, fetching, error } = useQuery(client, query);

	if (fetching) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;

	const filterParticipants = (registrations: typeof results) => {
		if (!minLevel || !maxLevel) return registrations;

		return registrations?.filter((registration) => {
			const currentDivision = registration.user?.current_division;
			if (!currentDivision) return true;

			const division = getDivision(currentDivision);
			const minIndex = leagueDivisionsSchema.options.indexOf(minLevel);
			const maxIndex = leagueDivisionsSchema.options.indexOf(maxLevel);
			const currentIndex = leagueDivisionsSchema.options.indexOf(division);
			return currentIndex >= minIndex && currentIndex <= maxIndex;
		});
	};

	const filteredParticipants = filterParticipants(results);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Division</TableHead>
					<TableHead>Rating</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{filteredParticipants?.map((registration) => (
					<TableRow key={registration.id}>
						<TableCell>
							{registration.user
								? `${registration.user.first_name} ${registration.user.last_name}`
								: "Unknown User"}
						</TableCell>
						<TableCell>
							{registration.user?.current_division ?? "N/A"}
						</TableCell>
						<TableCell>{registration.user?.rating ?? "N/A"}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
