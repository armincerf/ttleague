"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/lib/triplit";
import type { User } from "@/triplit/schema";
import { useLoadingState } from "@/hooks/useLoadingState";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

function PlayerSkeleton({ count }: { count: number }) {
	const skeletons = [];
	for (const i of Array(count).keys()) {
		skeletons.push(
			<div key={`skeleton-${i}`} className="-ml-3 first:ml-0">
				<Skeleton className="w-10 h-10 rounded-full" />
			</div>,
		);
	}
	return <>{skeletons}</>;
}

function PlayerAvatar({
	player,
}: {
	player: User;
}) {
	const [isOpen, setIsOpen] = useState(false);
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

	const content = (
		<div>
			<p>
				{player.first_name} {player.last_name}
			</p>
			<p>Events Played: {registrationCount}</p>
		</div>
	);

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
				{content}
				<Link href={`/users/${player.id}`} passHref>
					<Button variant="outline" className="mt-2 w-full">
						View Profile
					</Button>
				</Link>
			</PopoverContent>
		</Popover>
	);
}

function PlayerAvatars({
	players,
	fetching,
	onShowMore,
}: {
	players: User[];
	fetching: boolean;
	onShowMore: () => void;
}) {
	const isLoading = useLoadingState(fetching, players);

	if (isLoading) {
		return <PlayerSkeleton count={5} />;
	}

	if (!isLoading && !players.length) {
		return <p>No players in this league yet</p>;
	}

	return (
		<>
			{players.slice(0, 5).map((player, index) => (
				<div
					key={player.id}
					className="relative"
					style={{
						width: "40px",
						height: "40px",
						marginLeft: index > 0 ? "-12px" : "0",
					}}
				>
					<PlayerAvatar player={player} />
				</div>
			))}
			{players.length > 5 && (
				<Button
					variant="outline"
					size="icon"
					className="w-10 h-10 rounded-full -ml-3 shadow-none hover:bg-white hover:border-2 hover:border-black hover:border-opacity-15"
					onClick={onShowMore}
				>
					...
				</Button>
			)}
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

	const playerCount = league?.players?.length ?? 0;
	const players = league?.players ?? [];
	const currentUserInLeague = league?.players?.some(
		(player) => player.id === user?.id,
	);

	console.log(league, user);

	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle>
					{playerCount > 0
						? `${playerCount} ${playerCount === 1 ? "Player" : "Players"} in this League ${currentUserInLeague ? " (including you!)" : ""}`
						: isLoading
							? "Loading Players..."
							: "No Players in this League Yet"}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center">
					<PlayerAvatars
						players={players}
						fetching={fetching}
						onShowMore={() => setIsOpen(true)}
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
						{isLoading ? (
							<div className="space-y-2">
								<PlayerSkeleton count={5} />
								<PlayerSkeleton count={5} />
							</div>
						) : (
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
						)}
					</DialogContent>
				</Dialog>
			</CardContent>
		</Card>
	);
}

export default RegisteredPlayersList;
