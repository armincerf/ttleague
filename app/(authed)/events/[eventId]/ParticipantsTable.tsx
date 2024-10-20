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
	const minLevel = searchParams.get("minLevel") as LeagueDivision;
	const maxLevel = searchParams.get("maxLevel") as LeagueDivision;

	const query = client
		.query("event_registrations")
		.where("event_id", "=", eventId)
		.include("user")
		.build();

	const { results, fetching, error } = useQuery(client, query);

	if (fetching) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;

	const filteredParticipants = results?.filter((registration) => {
		if (!registration.user?.current_division) return false;
		const currentDivision = getDivision(registration.user.current_division);
		const minIndex = leagueDivisionsSchema.options.indexOf(minLevel);
		const maxIndex = leagueDivisionsSchema.options.indexOf(maxLevel);
		const currentIndex = leagueDivisionsSchema.options.indexOf(currentDivision);
		return currentIndex >= minIndex && currentIndex <= maxIndex;
	});

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
				{filteredParticipants?.map((registration) => {
					if (!registration.user) return null;
					return (
						<TableRow key={registration.id}>
							<TableCell>{`${registration.user.first_name} ${registration.user.last_name}`}</TableCell>
							<TableCell>{registration.user.current_division}</TableCell>
							<TableCell>{registration.user.rating}</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
