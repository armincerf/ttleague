"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryOne } from "@triplit/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { client } from "@/lib/triplit";
import type { AvatarUser } from "@/components/ui/avatar-group";
import { useLoadingState } from "@/hooks/useLoadingState";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { useUser } from "@clerk/nextjs";
import type { Event } from "@/lib/actions/events";

function PlayerAvatar({ player }: { player: AvatarUser }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button variant="ghost" className="p-0 h-auto">
					<Avatar className="hover:z-10 cursor-pointer hover:border-2 hover:border-black hover:border-opacity-15">
						<AvatarImage
							src={player.profile_image_url ?? ""}
							alt={`${player.first_name} ${player.last_name}`}
						/>
						<AvatarFallback>
							{player.first_name[0]}
							{player.last_name[0]}
						</AvatarFallback>
					</Avatar>
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<div>
					<p>
						{player.first_name} {player.last_name}
					</p>
				</div>
				<Link href={`/users/${player.id}`} passHref>
					<Button variant="outline" className="mt-2 w-full">
						View Profile
					</Button>
				</Link>
			</PopoverContent>
		</Popover>
	);
}

export function EventRegisteredPlayers({
	serverEvent,
}: {
	serverEvent: NonNullable<Event>;
}) {
	const eventId = serverEvent.id;
	const eventName = serverEvent.name;
	const [isOpen, setIsOpen] = useState(false);
	const { user } = useUser();

	const { result: clientEvent, fetching } = useQueryOne(
		client,
		client
			.query("events")
			.where(["id", "=", eventId])
			.include("registrations", (rel) =>
				rel("registrations").include("user").build(),
			),
	);

	const event = clientEvent ?? serverEvent;

	const isLoading = useLoadingState(fetching, event);
	const players =
		event?.registrations?.map((r) => r.user).filter(Boolean) ?? [];
	const playerCount = players.length;
	const currentUserRegistered = players.some(
		(player) => player.id === user?.id,
	);

	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle>
					{playerCount > 0
						? `${playerCount} ${
								playerCount === 1 ? "Player" : "Players"
							} Registered ${currentUserRegistered ? "(including you!)" : ""}`
						: isLoading
							? "Loading Players..."
							: "No Players Registered Yet"}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center">
					<AvatarGroup
						users={players}
						loading={isLoading}
						onShowMore={() => setIsOpen(true)}
						renderAvatar={(player) => <PlayerAvatar player={player} />}
					/>
				</div>
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogContent className="w-11/12 sm:w-full sm:max-w-3xl max-h-[90vh] overflow-auto">
						<DialogHeader>
							<DialogTitle>{eventName} Players</DialogTitle>
							<DialogDescription>
								List of players registered for {eventName}
							</DialogDescription>
						</DialogHeader>
						<ul>
							{players.map((player) => (
								<li key={player.id} className="flex items-center py-2">
									<Avatar className="mr-2">
										<AvatarImage
											src={player.profile_image_url ?? ""}
											alt={`${player.first_name} ${player.last_name}`}
										/>
										<AvatarFallback>
											{player.first_name[0]}
											{player.last_name[0]}
										</AvatarFallback>
									</Avatar>
									<Link
										href={`/users/${player.id}`}
										className="hover:underline"
									>
										{player.first_name} {player.last_name}
									</Link>
								</li>
							))}
						</ul>
					</DialogContent>
				</Dialog>
			</CardContent>
		</Card>
	);
}
