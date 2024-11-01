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
import { client } from "@/lib/triplit";
import type { AvatarUser } from "@/components/ui/avatar-group";
import { useLoadingState } from "@/hooks/useLoadingState";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AvatarGroup } from "@/components/ui/avatar-group";

function PlayerAvatar({
	player,
}: {
	player: AvatarUser;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const { leagueId } = useParams();

	const parsedLeagueId = leagueId?.toString() ?? "";

	const { results: registrations, fetching } = useQuery(
		client,
		client
			.query("event_registrations")
			.where([
				["league_id", "=", parsedLeagueId],
				["user_id", "=", player.id],
			])
			.build(),
	);

	const registrationCount = registrations?.length ?? 0;

	return (
		<>
			<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
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
						<p>Events Played: {registrationCount}</p>
					</div>
					<Link href={`/users/${player.id}`} passHref>
						<Button variant="outline" className="mt-2 w-full">
							View Profile
						</Button>
					</Link>
				</PopoverContent>
			</Popover>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="w-11/12 sm:w-full sm:max-w-3xl max-h-[90vh] overflow-auto">
					<DialogHeader>
						<DialogTitle>
							{player.first_name} {player.last_name}
						</DialogTitle>
						<DialogDescription>
							List of players registered for {player.first_name}{" "}
							{player.last_name}
						</DialogDescription>
					</DialogHeader>
					<ul>
						{registrations?.map((registration) => (
							<li key={registration.id} className="flex items-center py-2">
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
								<Link href={`/users/${player.id}`} className="hover:underline">
									{player.first_name} {player.last_name}
								</Link>
							</li>
						))}
					</ul>
				</DialogContent>
			</Dialog>
		</>
	);
}

function RegisteredPlayersList({
	leagueId,
	leagueName,
}: { leagueId: string; leagueName: string }) {
	const [isOpen, setIsOpen] = useState(false);

	const { result: league, fetching } = useQueryOne(
		client,
		client
			.query("leagues")
			.where(["id", "=", leagueId])
			.include("players")
			.build(),
	);
	const { user } = useUser();

	const isLoading = useLoadingState(fetching, league);
	const players = league?.players ?? [];
	const playerCount = players.length;
	const currentUserInLeague = players.some((player) => player.id === user?.id);

	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle>
					{playerCount > 0
						? `${playerCount} ${
								playerCount === 1 ? "Player" : "Players"
							} in this League ${
								currentUserInLeague ? " (including you!)" : ""
							}`
						: isLoading
							? "Loading Players..."
							: "No Players in this League Yet"}
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
							<DialogTitle>{leagueName} Players</DialogTitle>
							<DialogDescription>
								List of players registered for {leagueName}
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

export default RegisteredPlayersList;
