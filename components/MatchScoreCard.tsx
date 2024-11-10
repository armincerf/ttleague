"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { ShareMatchButton } from "./ShareMatchButton";
import { useRef } from "react";
import Link from "next/link";
import { useQueryOne } from "@triplit/react";
import { client } from "@/lib/triplit";
import { getDivision } from "@/lib/ratingSystem";

export interface Player {
	id: string;
	name: string;
	division: string;
	rating: number;
	avatar?: string;
}

export interface MatchScore {
	player1Points: number;
	player2Points: number;
	completedAt?: Date;
	startedAt?: Date;
	isValid: boolean;
}

interface MatchProps {
	player1: Player;
	player2: Player;
	scores: MatchScore[];
	isSubmitted?: boolean;
	isCertified?: boolean;
	isCarriedOver?: boolean;
	isCanceled?: boolean;
	umpire?: string;
	tableNumber?: number;
	bestOf: number;
	leagueName: string;
	eventName?: string;
	eventDate?: Date;
	isManuallyCreated?: boolean;
}

interface PlayerCardProps {
	player: Player;
}

function PlayerCard({ player }: PlayerCardProps) {
	return (
		<div className="bg-white rounded-lg px-2 py-4">
			<div className="flex items-center justify-between">
				<div className="flex flex-row items-center space-x-2">
					<Link href={`/users/${player.id}`}>
						<div className="font-semibold underline">{player.name}</div>
					</Link>
					<div className="text-sm text-gray-600">{player.division}</div>
				</div>
				<div className="hidden md:block">
					{player.avatar && (
						<Image
							src={player.avatar}
							alt={player.name}
							width={20}
							height={20}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

function createEmptyScore(): MatchScore {
	return {
		player1Points: 0,
		player2Points: 0,
		isValid: false,
	};
}

export function MatchScoreCard({
	player1,
	player2,
	scores,
	bestOf,
	isSubmitted,
	isCertified,
	isCarriedOver,
	isCanceled,
	umpire,
	tableNumber,
	leagueName,
	eventName,
	eventDate,
	isManuallyCreated,
}: MatchProps) {
	const cardRef = useRef<HTMLDivElement>(null);

	const gamesNeededToWin = Math.ceil(bestOf / 2);
	const paddedScores = [
		...scores,
		...Array(bestOf - scores.length)
			.fill(0)
			.map(createEmptyScore),
	];

	const totalGamesWon = paddedScores.reduce(
		(acc, score) => {
			if (
				(score.player1Points >= 11 &&
					score.player1Points > score.player2Points) ||
				(score.player2Points >= 11 && score.player2Points > score.player1Points)
			) {
				return {
					player1:
						acc.player1 + (score.player1Points > score.player2Points ? 1 : 0),
					player2:
						acc.player2 + (score.player2Points > score.player1Points ? 1 : 0),
				};
			}
			return acc;
		},
		{ player1: 0, player2: 0 },
	);

	const matchIsComplete =
		totalGamesWon.player1 >= gamesNeededToWin ||
		totalGamesWon.player2 >= gamesNeededToWin;

	return (
		<div
			ref={cardRef}
			className="w-full max-w-2xl bg-white rounded-lg shadow-md overflow-hidden my-4"
		>
			{/* Match Info Header - now with share button */}
			<div className="px-4 py-2 bg-gray-50">
				<div className="flex justify-between items-center">
					<div className="flex items-center space-x-4">
						<span className="MatchDescription">Match</span>
						{umpire && (
							<span className="MatchInfo-umpire">Umpire: {umpire}</span>
						)}
						{isManuallyCreated && (
							<span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
								Manually Created
							</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						<div className="hidden md:block">
							{tableNumber && <div>Table {tableNumber}</div>}
						</div>
						{matchIsComplete && (
							<ShareMatchButton
								winner={
									totalGamesWon.player1 > totalGamesWon.player2
										? player1.name
										: player2.name
								}
								player1={player1}
								player2={player2}
								totalGamesWon={totalGamesWon}
								cardRef={cardRef}
								leagueName={leagueName}
								eventName={eventName}
								eventDate={eventDate}
							/>
						)}
					</div>
				</div>
			</div>

			<div className="bg-blue-50">
				<PlayerCard player={player1} />
				<div className="flex border-y border-blue-200">
					{/* Games Score */}
					<div className="flex flex-1 flex-col border-r border-blue-200 text-white font-bold max-w-16">
						<div
							className={cn(
								"text-center flex flex-col flex-1 justify-center items-center border-b border-blue-200",
								totalGamesWon.player1 > totalGamesWon.player2
									? "bg-tt-blue "
									: "bg-tt-blue/60",
							)}
						>
							{totalGamesWon.player1}
						</div>
						<div
							className={cn(
								"text-center flex flex-col flex-1 justify-center items-center",
								totalGamesWon.player1 > totalGamesWon.player2
									? "bg-tt-blue/40"
									: "bg-tt-blue",
							)}
						>
							{totalGamesWon.player2}
						</div>
					</div>

					<div className="flex flex-1">
						{paddedScores.map((score, index) => (
							<div
								key={`score-${
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									index
								}`}
								className="flex flex-col flex-1 border-r last:border-r-0 border-blue-200"
							>
								<div
									className={cn(
										"text-center p-2 bg-white text-tt-blue/70 border-b border-blue-200",
										score.player1Points > score.player2Points && "font-bold",
									)}
								>
									{score.startedAt ? score.player1Points : "-"}
								</div>
								<div
									className={cn(
										"text-center p-2 bg-white text-tt-blue/70",
										score.player2Points > score.player1Points && "font-bold",
									)}
								>
									{score.startedAt ? score.player2Points : "-"}
								</div>
							</div>
						))}
					</div>
				</div>

				<PlayerCard player={player2} />
			</div>

			{matchIsComplete && (
				<Link
					href={`/users/${
						totalGamesWon.player1 > totalGamesWon.player2
							? player1.id
							: player2.id
					}`}
				>
					<div className="px-4 py-2 bg-green-50 text-sm text-green-700">
						Winner:{" "}
						{totalGamesWon.player1 > totalGamesWon.player2
							? player1.name
							: player2.name}
					</div>
				</Link>
			)}

			{/* Match Status */}
			{(isSubmitted || isCertified || isCarriedOver || isCanceled) && (
				<div className="px-4 py-2 bg-gray-50 text-sm">
					<div className="flex space-x-2">
						{isSubmitted && <span className="text-green-600">Submitted</span>}
						{isCertified && <span className="text-blue-600">Certified</span>}
						{isCarriedOver && (
							<span className="text-yellow-600">Carried Over</span>
						)}
						{isCanceled && <span className="text-red-600">Canceled</span>}
					</div>
				</div>
			)}
		</div>
	);
}

export function AutoMatchScoreCard({
	matchId,
	playerOneId,
}: {
	matchId: string;
	playerOneId: string;
}) {
	const { result: match } = useQueryOne(
		client,
		client
			.query("matches")
			.where("id", "=", matchId)
			.include("games")
			.include("player1")
			.include("player2")
			.include("umpireUser")
			.include("event"),
	);
	if (!match) return null;
	const playerOne =
		playerOneId === match.player_1 ? match.player1 : match.player2;
	const playerTwo =
		playerOneId === match.player_1 ? match.player2 : match.player1;
	if (!playerOne || !playerTwo) return null;
	const games = match.games.sort((a, b) => a.game_number - b.game_number);

	return (
		<MatchScoreCard
			player1={{
				id: playerOne.id,
				name: `${playerOne.first_name} ${playerOne.last_name}`,
				division: getDivision(playerOne?.current_division),
				rating: 0,
			}}
			player2={{
				id: playerTwo.id,
				name: `${playerTwo.first_name} ${playerTwo.last_name}`,
				division: getDivision(playerTwo?.current_division),
				rating: 0,
			}}
			scores={games.map((game) => ({
				player1Points: game.player_1_score,
				player2Points: game.player_2_score,
				startedAt: game.created_at,
				completedAt: game.completed_at,
				isValid: true,
			}))}
			leagueName={""}
			bestOf={match.best_of}
			eventName={match.event?.name ?? ""}
			eventDate={match.event?.start_time}
		/>
	);
}
