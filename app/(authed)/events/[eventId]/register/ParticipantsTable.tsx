"use client";

import { useEntity, useQuery } from "@triplit/react";
import { client } from "@/lib/triplit";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getDivision, leagueDivisionsSchema } from "@/lib/ratingSystem";
import { useUser } from "@clerk/nextjs";

const sortedLeagueDivisions = leagueDivisionsSchema.options.reverse();

type ParticipantsTableProps = {
	eventId: string;
	defaultMinLevel: number;
	defaultMaxLevel: number;
};

export default function ParticipantsTable({
	eventId,
	defaultMinLevel,
	defaultMaxLevel,
}: ParticipantsTableProps) {
	const { results: registrations } = useQuery(
		client,
		client
			.query("event_registrations")
			.where("event_id", "=", eventId)
			.include("user")
			.build(),
	);

	const { user } = useUser();
	const { result: userEntity } = useEntity(client, "users", user?.id ?? "");

	const userMinLevelIndex = sortedLeagueDivisions.indexOf(
		userEntity?.default_min_opponent_level || "",
	);
	const userMaxLevelIndex = sortedLeagueDivisions.indexOf(
		userEntity?.default_max_opponent_level || "",
	);

	if (!registrations || registrations.length === 0) {
		return <p>No participants registered yet.</p>;
	}

	const filteredRegistrations = registrations.filter((registration) => {
		const userDivisionString = getDivision(registration.user?.current_division);
		const userDivisionIndex = sortedLeagueDivisions.indexOf(userDivisionString);

		const minLevelIndex =
			userMinLevelIndex !== -1 ? userMinLevelIndex : defaultMinLevel;
		const maxLevelIndex =
			userMaxLevelIndex !== -1 ? userMaxLevelIndex : defaultMaxLevel;

		const isWithinRange =
			userDivisionIndex >= minLevelIndex && userDivisionIndex <= maxLevelIndex;

		return userDivisionIndex !== -1 && isWithinRange;
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
				{filteredRegistrations.map((registration) => (
					<TableRow key={registration.id}>
						<TableCell>
							{registration.user?.first_name} {registration.user?.last_name}
						</TableCell>
						<TableCell>{registration.user?.current_division}</TableCell>
						<TableCell>{registration.user?.rating}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
