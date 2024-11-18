import { ImageResponse } from "next/og";
import { fetchMatch } from "@/lib/actions/matches";
import { getDivision } from "@/lib/ratingSystem";
import type { NextRequest } from "next/server";
import { cn } from "@/lib/utils";

export const runtime = "edge";

function createEmptyScore() {
	return {
		player1Points: 0,
		player2Points: 0,
		isValid: false,
	};
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const matchId = searchParams.get("matchId");

		if (!matchId) {
			return new ImageResponse(<span>Match ID is required</span>);
		}

		const match = await fetchMatch(matchId);

		if (!match || !match.player1 || !match.player2) {
			return new ImageResponse(<span>Match not found</span>);
		}

		const scores = match.games
			.sort((a, b) => b.game_number - a.game_number)
			.map((game) => ({
				player1Points: game.player_1_score,
				player2Points: game.player_2_score,
				startedAt: game.started_at,
				isValid: true,
			}));

		const bestOf = match.best_of ?? 5;
		const paddedScores = [
			...scores,
			...Array(bestOf - scores.length)
				.fill(0)
				.map(createEmptyScore),
		];

		const totalGamesWon = paddedScores.reduce(
			(acc, score) => ({
				player1:
					acc.player1 + (score.player1Points > score.player2Points ? 1 : 0),
				player2:
					acc.player2 + (score.player2Points > score.player1Points ? 1 : 0),
			}),
			{ player1: 0, player2: 0 },
		);

		return new ImageResponse(
			<span
				style={{
					display: "flex",
					height: "100%",
					width: "100%",
					alignItems: "center",
					justifyContent: "center",
					padding: "64px",
					fontFamily: "sans-serif",
					backgroundImage: "linear-gradient(to bottom, #dbf4ff, #fff1f1)",
				}}
			>
				{/* Card Container */}
				<span
					style={{
						width: "auto",
						height: "500px",
						backgroundColor: "white",
						borderRadius: "16px",
						boxShadow:
							"0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
						overflow: "hidden",
					}}
				>
					{/* Main Content */}
					<span
						style={{
							display: "flex",
							flexDirection: "column",
							height: "500px",
							justifyContent: "space-between",
						}}
					>
						<span
							style={{
								fontWeight: 600 || 500,
								fontSize: "50px",
								paddingLeft: "0.5rem",
							}}
						>
							MK Table Tennis Singles League
						</span>
						{/* Player 1 */}
						<span
							style={{
								display: "flex",
								alignItems: "center",
								width: "100%",
								padding: "16px",
								borderBottom: "1px solid white",
							}}
						>
							<span style={{ display: "flex", alignItems: "center" }}>
								<span
									style={{
										color:
											totalGamesWon.player1 > totalGamesWon.player2
												? "#16a34a"
												: "#dc2626",
										marginRight: "12px",
										fontSize: "24px",
									}}
								>
									{totalGamesWon.player1 > totalGamesWon.player2
										? "WIN"
										: "LOSS"}
								</span>
								<span style={{ fontWeight: 600 || 500, fontSize: "30px" }}>
									{`${match.player1.first_name} ${match.player1.last_name}`}
								</span>
								<span
									style={{
										color: "rgb(107 114 128)",
										fontSize: "24px",
										paddingLeft: "0.5rem",
									}}
								>
									{getDivision(match.player1.current_division)}
								</span>
							</span>
						</span>

						{/* Scores */}
						<span
							style={{
								display: "flex",
								borderBottom: "1px solid white",
								width: "100%",
								height: "280px",
							}}
						>
							{/* Games Won */}
							<span
								style={{
									display: "flex",
									flexDirection: "column",
									borderRight: "1px solid white",
									width: "140px",
									minWidth: "140px",
								}}
							>
								<span
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										height: "140px",
										width: "140px",
										textAlign: "center",
										color: "white",
										fontWeight: "bold",
										fontSize: "30px",
										borderBottom: "1px solid rgb(209 213 219)",
										backgroundColor: "#2563eb",
										textDecoration:
											totalGamesWon.player1 > totalGamesWon.player2
												? "underline"
												: "none",
										opacity:
											totalGamesWon.player1 > totalGamesWon.player2 ? 0.8 : 1,
									}}
								>
									{totalGamesWon.player1}
								</span>
								<span
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										height: "140px",
										textAlign: "center",
										color: "white",
										fontSize: "30px",
										backgroundColor: "#2563eb",
										textDecoration:
											totalGamesWon.player2 > totalGamesWon.player1
												? "underline"
												: "none",
										opacity:
											totalGamesWon.player1 > totalGamesWon.player2 ? 0.8 : 1,
									}}
								>
									{totalGamesWon.player2}
								</span>
							</span>

							{/* Individual Game Scores */}
							{paddedScores.map((score, index) => (
								<span
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									key={index}
									style={{
										display: "flex",
										flexDirection: "column",
										width: "140px",
										minWidth: "140px",
										borderRight: "1px solid white",
									}}
								>
									<span
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											height: "140px",
											textAlign: "center",
											backgroundColor: score.isValid ? "#bfdbfe" : "white",
											borderBottom: "1px solid white",
											fontSize: "30px",
											textDecoration:
												score.player1Points > score.player2Points
													? "underline"
													: "none",
											color:
												score.player1Points > score.player2Points
													? "black"
													: "rgb(35 31 27)",
										}}
									>
										{score.isValid ? score.player1Points : "-"}
									</span>
									<span
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											height: "140px",
											textAlign: "center",
											fontSize: "30px",
											backgroundColor: score.isValid ? "#bfdbfe" : "white",
											textDecoration:
												score.player2Points > score.player1Points
													? "underline"
													: "none",
											color:
												score.player2Points > score.player1Points
													? "black"
													: "rgb(35 31 27)",
										}}
									>
										{score.isValid ? score.player2Points : "-"}
									</span>
								</span>
							))}
						</span>

						{/* Player 2 */}
						<span
							style={{
								display: "flex",
								alignItems: "center",
								padding: "16px",
								width: "500px",
							}}
						>
							<span style={{ display: "flex", alignItems: "center" }}>
								<span
									style={{
										color:
											totalGamesWon.player2 > totalGamesWon.player1
												? "#16a34a"
												: "#dc2626",
										marginRight: "12px",
										fontSize: "24px",
									}}
								>
									{totalGamesWon.player2 > totalGamesWon.player1
										? "WIN"
										: "LOSS"}
								</span>
								<span style={{ fontWeight: 600 || 500, fontSize: "30px" }}>
									{`${match.player2.first_name} ${match.player2.last_name}`}
								</span>
								<span
									style={{
										color: "rgb(107 114 128)",
										fontSize: "24px",
										paddingLeft: "0.5rem",
									}}
								>
									{getDivision(match.player2.current_division)}
								</span>
							</span>
						</span>
					</span>
				</span>
			</span>,
			{
				width: 1200,
				height: 630,
			},
		);
	} catch (error) {
		console.error("Error generating image:", error);
		return new ImageResponse(
			<span
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				Error generating image
			</span>,
		);
	}
}
