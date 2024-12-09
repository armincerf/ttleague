"use client";
import {
	useState,
	useMemo,
	useCallback,
	useRef,
	type MouseEvent as ReactMouseEvent,
	type KeyboardEvent,
} from "react";
import { useQuery } from "@triplit/react";
import { client } from "@/lib/triplit";
import { rating as baseRatingFunc, rate, ordinal } from "openskill";
import { scaleLinear, scaleOrdinal } from "@visx/scale";
import { extent, bisector, max } from "d3-array";
import { LinePath, AreaClosed, Line } from "@visx/shape";
import { Group } from "@visx/group";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { localPoint } from "@visx/event";
import { TooltipWithBounds, Tooltip, defaultStyles } from "@visx/tooltip";
import { Brush } from "@visx/brush";
import type { Bounds } from "@visx/brush/lib/types";
import { format } from "date-fns";
import type { Game, Match, User } from "@/triplit/schema";

const rating = baseRatingFunc;
const BASE_RATING = { mu: 25, sigma: 8.333 };

interface PlayerGameHistory {
	gameId: string;
	date: Date;
	rating: { mu: number; sigma: number };
	ordinalRating: number;
}

interface PlayerRankingHistory {
	userId: string;
	name: string;
	history: PlayerGameHistory[];
	currentRating: { mu: number; sigma: number };
}

interface DensityPoint {
	x: number;
	y: number;
}

interface Distribution {
	player: PlayerRankingHistory;
	points: DensityPoint[];
	mu: number;
	sigma: number;
}

function calculateRating(r: { mu: number; sigma: number }) {
	// TrueSkill conservative rating: μ - 2σ
	return Math.max(0, r.mu - 2 * r.sigma);
}

function normalPDF(x: number, mu: number, sigma: number) {
	const coeff = 1 / (sigma * Math.sqrt(2 * Math.PI));
	const exponent = -((x - mu) ** 2) / (2 * sigma ** 2);
	return coeff * Math.exp(exponent);
}

export function RankingSystem() {
	const [rankingHistory, setRankingHistory] = useState<PlayerRankingHistory[]>(
		[],
	);
	const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

	// Query games and users
	const { results: games, fetching: gamesLoading } = useQuery(
		client,
		client
			.query("games")
			.select([
				"id",
				"match_id",
				"player_1_score",
				"player_2_score",
				"started_at",
				"game_number",
			])
			.order("started_at", "ASC"),
	);

	const { results: matches, fetching: matchesLoading } = useQuery(
		client,
		client.query("matches").select(["id", "player_1", "player_2"]),
	);

	const { results: users, fetching: usersLoading } = useQuery(
		client,
		client.query("users").select(["id", "first_name", "last_name"]),
	);

	const generateRankings = () => {
		if (!games || !users || !matches) return;
		if (gamesLoading || usersLoading || matchesLoading) return;

		const playerRatings: Record<string, { mu: number; sigma: number }> = {};
		const history: Record<string, PlayerRankingHistory> = {};
		for (const u of users) {
			playerRatings[u.id] = rating(BASE_RATING);
			history[u.id] = {
				userId: u.id,
				name: `${u.first_name} ${u.last_name}`,
				history: [],
				currentRating: rating(BASE_RATING),
			};
		}

		const validGames = games
			.map((g) => ({
				...g,
				match: matches.find((m) => m.id === g.match_id),
			}))
			.filter((g) => g.match?.player_1 && g.match?.player_2);

		for (const g of validGames) {
			const p1 = g.match?.player_1;
			const p2 = g.match?.player_2;
			if (!p1 || !p2) continue;
			const p1Rating = playerRatings[p1];
			const p2Rating = playerRatings[p2];
			if (!p1Rating || !p2Rating) continue;

			const winner = g.player_1_score > g.player_2_score ? p1 : p2;

			const [[newP1], [newP2]] = rate([[p1Rating], [p2Rating]], {
				rank: winner === p1 ? [1, 2] : [2, 1],
			});

			playerRatings[p1] = newP1;
			playerRatings[p2] = newP2;

			for (const pid of [p1, p2]) {
				const currentRating = playerRatings[pid];
				history[pid].history.push({
					gameId: g.id,
					date: new Date(g.started_at),
					rating: currentRating,
					ordinalRating: ordinal(currentRating),
				});
				history[pid].currentRating = currentRating;
			}
		}

		// Filter out players with fewer than 5 games played
		const filtered = Object.values(history).filter(
			(h) => h.history.length >= 5,
		);

		setRankingHistory(filtered);
	};

	const sortedPlayers = useMemo(() => {
		const players = [...rankingHistory];
		players.sort((a, b) => {
			const aR = calculateRating(a.currentRating);
			const bR = calculateRating(b.currentRating);
			if (Math.abs(aR - bR) < 0.1) {
				return a.currentRating.sigma - b.currentRating.sigma;
			}
			return bR - aR;
		});
		return players;
	}, [rankingHistory]);

	const selectedPlayerHistory = useMemo(() => {
		if (!selectedPlayer) return null;
		return rankingHistory.find((p) => p.userId === selectedPlayer) || null;
	}, [selectedPlayer, rankingHistory]);

	if (gamesLoading || usersLoading || matchesLoading) {
		return <div>Loading data...</div>;
	}

	const handlePlayerClick = (playerId: string) => {
		setSelectedPlayer(playerId);
	};

	const handlePlayerKeyDown = (
		event: KeyboardEvent<HTMLLIElement>,
		playerId: string,
	) => {
		if (event.key === "Enter" || event.key === " ") {
			setSelectedPlayer(playerId);
		}
	};

	return (
		<div className="space-y-6 w-full pb-12">
			<button
				type="button"
				onClick={generateRankings}
				onKeyUp={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						generateRankings();
					}
				}}
				className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
			>
				Generate Rankings ({games?.length ?? 0} games, {users?.length ?? 0}{" "}
				users)
			</button>

			{rankingHistory.length > 0 && (
				<div className="border rounded p-4">
					<h2 className="text-lg font-semibold mb-4">Current Rankings</h2>
					<p className="text-sm text-gray-600 mb-2">
						Showing only players with at least 5 games played. The "Estimated
						Skill Score" is μ - 2σ, which gives a conservative estimate.
					</p>
					<ul className="space-y-2">
						{sortedPlayers.map((player, index) => {
							const ratingValue = calculateRating(player.currentRating);
							return (
								<li
									key={player.userId}
									className={`cursor-pointer p-2 rounded ${
										selectedPlayer === player.userId
											? "bg-blue-100"
											: "hover:bg-gray-100"
									}`}
									onClick={() => handlePlayerClick(player.userId)}
									onKeyDown={(e) => handlePlayerKeyDown(e, player.userId)}
									aria-label={`Select ${player.name}`}
								>
									<div className="flex flex-col">
										<div className="flex justify-between items-center">
											<span className="font-medium">
												{index + 1}. {player.name}
											</span>
											<span className="text-gray-600 space-x-4">
												<span>μ: {player.currentRating.mu.toFixed(1)}</span>
												<span>σ: {player.currentRating.sigma.toFixed(1)}</span>
												<span className="font-semibold">
													Estimated Skill Score: {ratingValue.toFixed(1)}
												</span>
											</span>
										</div>
										<div className="text-sm text-gray-500 mt-1">
											Games played: {player.history.length}
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				</div>
			)}

			{selectedPlayerHistory && (
				<div className="border rounded p-4">
					<h2 className="text-lg font-semibold mb-4">
						Rating Over Time (by Game Number): {selectedPlayerHistory.name}
					</h2>
					<SinglePlayerRatingChart player={selectedPlayerHistory} />
					<div className="mt-4 text-sm text-gray-600">
						<p>
							Drag over the lower chart brush to zoom the displayed range of
							games.
						</p>
						<p>Hover over the line to see exact ratings on a given game.</p>
					</div>
				</div>
			)}

			{rankingHistory.length > 0 && (
				<AllPlayersDistributionChart players={rankingHistory} />
			)}
		</div>
	);
}

/** Updated Single Player Rating Chart using game index for X-axis and sigma bounds */
function SinglePlayerRatingChart({ player }: { player: PlayerRankingHistory }) {
	const [selection, setSelection] = useState<Bounds | null>(null);
	const brushRef = useRef<Brush>(null);

	// Transform player's history into data indexed by game number
	const data = useMemo(() => {
		return player.history
			.slice()
			.sort((a, b) => a.date.getTime() - b.date.getTime())
			.map((h, i) => {
				const mu = h.rating.mu;
				const sigma = h.rating.sigma;
				return {
					index: i + 1, // game number (1-based)
					date: h.date,
					mu: mu,
					sigma: sigma,
					upperBound: mu + 2 * sigma,
					lowerBound: Math.max(0, mu - 2 * sigma),
					conservativeRating: Math.max(0, mu - 2 * sigma),
				};
			});
	}, [player]);

	const width = 800;
	const height = 400;
	const margin = { top: 20, right: 30, bottom: 50, left: 50 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;

	// Extents for x (game index) and y (rating)
	const xDomain = useMemo(() => [1, data.length], [data]);
	const yValues = data.flatMap((d) => [d.lowerBound, d.upperBound]);
	const yExtent = extent(yValues) as [number, number];

	const xScale = useMemo(
		() =>
			scaleLinear({
				domain: xDomain,
				range: [0, innerWidth],
				nice: true,
			}),
		[xDomain, innerWidth],
	);

	const yScale = useMemo(
		() =>
			scaleLinear({
				domain: [yExtent[0] - 5, yExtent[1] + 5],
				range: [innerHeight, 0],
				nice: true,
			}),
		[yExtent, innerHeight],
	);

	// Filter data by brush selection (if any)
	const filteredData = useMemo(() => {
		if (!selection) return data;
		const { x0, x1 } = selection;
		// Convert screen coords back to domain
		const startIndex = Math.max(1, Math.round(xScale.invert(x0)));
		const endIndex = Math.min(data.length, Math.round(xScale.invert(x1)));
		return data.filter((d) => d.index >= startIndex && d.index <= endIndex);
	}, [selection, data, xScale]);

	const [tooltipData, setTooltipData] = useState<{
		index: number;
		conservativeRating: number;
		mu: number;
		sigma: number;
		date: Date;
	} | null>(null);
	const [tooltipLeft, setTooltipLeft] = useState<number>(0);
	const [tooltipTop, setTooltipTop] = useState<number>(0);
	const tooltipStyles = {
		...defaultStyles,
		background: "#fff",
		border: "1px solid #999",
		padding: "8px",
	};

	const bisectIndex = bisector<{ index: number }, number>((d) => d.index).left;

	const handleTooltip = useCallback(
		(event: ReactMouseEvent<SVGRectElement>) => {
			const point = localPoint(event);
			if (!point) return;
			const xVal = xScale.invert(point.x - margin.left);
			const index = bisectIndex(filteredData, xVal, 1);
			const d0 = filteredData[index - 1];
			const d1 = filteredData[index];
			let d = d0;
			if (d1 && d0) {
				d = xVal - d0.index > d1.index - xVal ? d1 : d0;
			}
			if (d) {
				setTooltipData(d);
				setTooltipLeft(xScale(d.index) + margin.left);
				setTooltipTop(yScale(d.conservativeRating) + margin.top);
			}
		},
		[filteredData, xScale, yScale, bisectIndex],
	);

	// Identify date groupings for vertical background shading
	const dateGroups = useMemo(() => {
		const groups: { start: number; end: number; date: string }[] = [];
		let currentDate: string | null = null;
		let startIndex: number | null = null;

		for (const d of data) {
			const dayKey = format(d.date, "yyyy-MM-dd");
			if (dayKey !== currentDate) {
				if (currentDate && startIndex !== null) {
					// close previous group
					groups.push({
						start: startIndex,
						end: d.index - 1,
						date: currentDate,
					});
				}
				currentDate = dayKey;
				startIndex = d.index;
			}
		}
		// close last group
		if (currentDate && startIndex !== null) {
			groups.push({
				start: startIndex,
				end: data[data.length - 1].index,
				date: currentDate,
			});
		}
		return groups;
	}, [data]);

	// Brush setup (for zooming)
	const brushMargin = { top: 0, bottom: 20, left: 50, right: 30 };
	const brushHeight = 100;
	const brushWidth = width - brushMargin.left - brushMargin.right;

	const xBrushScale = scaleLinear({
		domain: xDomain,
		range: [0, brushWidth],
	});

	const yBrushScale = scaleLinear({
		domain: yExtent,
		range: [brushHeight, 0],
		nice: true,
	});

	const onBrushChange = useCallback((domain: Bounds | null) => {
		setSelection(domain);
	}, []);

	return (
		<div style={{ position: "relative" }}>
			<svg width={width} height={height} aria-label="Rating Chart">
				<title>Rating Chart</title>
				<Group left={margin.left} top={margin.top}>
					{/* Draw vertical date bands */}
					{dateGroups.map((g, i) => {
						const startX = xScale(g.start);
						const endX = xScale(g.end);
						return (
							<rect
								key={g.date}
								x={startX}
								width={endX - startX}
								y={0}
								height={innerHeight}
								fill={i % 2 === 0 ? "#f0f8ff" : "#fafafa"}
								opacity={0.3}
							/>
						);
					})}

					<AxisLeft scale={yScale} label="Estimated Skill Score" />
					<AxisBottom
						top={innerHeight}
						scale={xScale}
						tickFormat={(d) => `G${d}`} // prefix G for "Game"
						label="Game Number"
					/>

					{/* Confidence area (μ ± 2σ) */}
					<AreaClosed
						data={filteredData}
						x={(d) => xScale(d.index)}
						y0={(d) => yScale(d.lowerBound)}
						y1={(d) => yScale(d.upperBound)}
						yScale={yScale}
						fill="#8884d8"
						opacity={0.2}
					/>

					{/* μ line (optional) */}
					<LinePath
						data={filteredData}
						x={(d) => xScale(d.index)}
						y={(d) => yScale(d.mu)}
						stroke="orange"
						strokeWidth={2}
						strokeDasharray="4,2"
					/>

					{/* Conservative rating line (μ - 2σ) */}
					<LinePath
						data={filteredData}
						x={(d) => xScale(d.index)}
						y={(d) => yScale(d.conservativeRating)}
						stroke="#8884d8"
						strokeWidth={2}
					/>

					<rect
						x={0}
						y={0}
						width={innerWidth}
						height={innerHeight}
						fill="transparent"
						onMouseMove={handleTooltip}
						onMouseLeave={() => setTooltipData(null)}
					/>
				</Group>
			</svg>

			{tooltipData && (
				<Tooltip top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
					<div>
						<strong>Game #{tooltipData.index}</strong>
						<br />
						Date: {format(tooltipData.date, "PPP")}
						<br />
						μ: {tooltipData.mu.toFixed(2)}, σ: {tooltipData.sigma.toFixed(2)}
						<br />
						Estimated Skill (μ - 2σ):{" "}
						{tooltipData.conservativeRating.toFixed(1)}
					</div>
				</Tooltip>
			)}

			<div className="mt-4">
				<h3 className="text-sm font-semibold">
					Zoom by selecting a range of game numbers:
				</h3>
				<svg
					width={width}
					height={brushHeight + brushMargin.top + brushMargin.bottom}
					aria-label="Brush Chart"
				>
					<title>Brush Chart</title>
					<Group left={brushMargin.left} top={brushMargin.top}>
						<AxisBottom
							top={brushHeight}
							scale={xBrushScale}
							tickFormat={(d) => `G${d}`}
						/>
						<AreaClosed
							data={data}
							x={(d) => xBrushScale(d.index)}
							y={(d) => yBrushScale(d.conservativeRating)}
							yScale={yBrushScale}
							fill="#8884d8"
							opacity={0.2}
							stroke="#8884d8"
						/>

						<Brush
							xScale={xBrushScale}
							yScale={yBrushScale}
							width={brushWidth}
							height={brushHeight}
							margin={brushMargin}
							handleSize={8}
							onChange={onBrushChange}
							ref={brushRef}
						/>
					</Group>
				</svg>
				<button
					type="button"
					className="mt-2 px-4 py-1 border rounded text-sm"
					onClick={() => setSelection(null)}
					onKeyUp={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							setSelection(null);
						}
					}}
				>
					Reset Zoom
				</button>
			</div>
		</div>
	);
}

function AllPlayersDistributionChart({
	players,
}: {
	players: PlayerRankingHistory[];
}) {
	const filteredPlayers = players.filter(
		(p) => p.currentRating && !Number.isNaN(p.currentRating.mu),
	);

	if (filteredPlayers.length === 0) return null;

	const width = Math.min(window.innerWidth, 800);
	const height = Math.min(window.innerHeight, 400);

	const margin = { top: 20, right: 30, bottom: 50, left: 50 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;

	// Generate distributions
	const distributions = useMemo<Distribution[]>(() => {
		const result: Distribution[] = [];
		for (const p of filteredPlayers) {
			const { mu, sigma } = p.currentRating;
			const stepCount = 200;
			const start = mu - 4 * sigma;
			const end = mu + 4 * sigma;
			const step = (end - start) / stepCount;
			const points: DensityPoint[] = [];
			for (let i = 0; i <= stepCount; i++) {
				const x = start + i * step;
				const y = normalPDF(x, mu, sigma);
				points.push({ x, y });
			}
			result.push({ player: p, points, mu, sigma });
		}
		return result;
	}, [filteredPlayers]);

	const allX = distributions.flatMap((d) => d.points.map((p) => p.x));
	const allY = distributions.flatMap((d) => d.points.map((p) => p.y));
	const xDomain = extent(allX) as [number, number];
	const yMax = max(allY) || 0;

	const xScale = useMemo(
		() =>
			scaleLinear({
				domain: xDomain,
				range: [0, innerWidth],
			}),
		[xDomain, innerWidth],
	);

	const yScale = useMemo(
		() =>
			scaleLinear({
				domain: [0, yMax],
				range: [innerHeight, 0],
				nice: true,
			}),
		[yMax, innerHeight],
	);

	const colorScale = useMemo(
		() =>
			scaleOrdinal<string, string>({
				domain: distributions.map((d) => d.player.userId),
				range: [
					"#8884d8",
					"#82ca9d",
					"#ffc658",
					"#ff8042",
					"#8dd1e1",
					"#a4de6c",
				],
			}),
		[distributions],
	);

	const [hoverX, setHoverX] = useState<number | null>(null);
	const [tooltipData, setTooltipData] = useState<{
		rating: number;
		densities: { name: string; density: number }[];
	} | null>(null);

	// Visibility state
	const [visiblePlayers, setVisiblePlayers] = useState<Record<string, boolean>>(
		() => Object.fromEntries(distributions.map((d) => [d.player.userId, true])),
	);

	const handleMouseMove = useCallback(
		(event: ReactMouseEvent<SVGRectElement>) => {
			const point = localPoint(event);
			if (!point) return;
			const xVal = xScale.invert(point.x - margin.left);
			setHoverX(point.x - margin.left);

			const densities = distributions
				.filter((d) => visiblePlayers[d.player.userId])
				.map((d) => {
					const density = normalPDF(xVal, d.mu, d.sigma);
					return { name: d.player.name, density };
				});

			setTooltipData({ rating: xVal, densities });
		},
		[xScale, distributions, visiblePlayers],
	);

	const handleMouseLeave = useCallback(() => {
		setHoverX(null);
		setTooltipData(null);
	}, []);

	const tooltipStyles = {
		...defaultStyles,
		background: "#fff",
		border: "1px solid #999",
	};

	const togglePlayerVisibility = (userId: string) => {
		setVisiblePlayers((prev) => ({
			...prev,
			[userId]: !prev[userId],
		}));
	};

	const handleToggleKeyDown = (
		event: KeyboardEvent<HTMLButtonElement>,
		userId: string,
	) => {
		if (event.key === "Enter" || event.key === " ") {
			togglePlayerVisibility(userId);
		}
	};

	const hideAll = () => {
		const newState: Record<string, boolean> = {};
		for (const d of distributions) {
			newState[d.player.userId] = false;
		}
		setVisiblePlayers(newState);
	};

	const showAll = () => {
		const newState: Record<string, boolean> = {};
		for (const d of distributions) {
			newState[d.player.userId] = true;
		}
		setVisiblePlayers(newState);
	};

	return (
		<div className="border rounded p-4" style={{ position: "relative" }}>
			<h2 className="text-lg font-semibold mb-4">
				All Players' Normal Distribution Curves
			</h2>
			<p className="text-sm text-gray-600 mb-4">
				Each line shows the probability density for a player's final rating.
				Hover over the chart to see detailed values. Click on a player in the
				legend to toggle their visibility.
			</p>
			<div className="mb-2 space-x-2">
				<button
					type="button"
					className="px-3 py-1 border rounded text-sm"
					onClick={hideAll}
					onKeyUp={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							hideAll();
						}
					}}
				>
					Hide All
				</button>
				<button
					type="button"
					className="px-3 py-1 border rounded text-sm"
					onClick={showAll}
					onKeyUp={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							showAll();
						}
					}}
				>
					Show All
				</button>
			</div>
			<svg width={width} height={height} aria-label="Distribution Chart">
				<title>Distribution Chart</title>
				<Group left={margin.left} top={margin.top}>
					<AxisLeft scale={yScale} label="Probability Density" />
					<AxisBottom
						top={innerHeight}
						scale={xScale}
						label="Estimated Skill Score"
						tickFormat={(d) => (d as number).toFixed(0)}
					/>

					{distributions.map(({ player, points }) => {
						if (!visiblePlayers[player.userId]) return null;
						return (
							<LinePath
								key={player.userId}
								data={points}
								x={(d) => xScale(d.x)}
								y={(d) => yScale(d.y)}
								stroke={colorScale(player.userId)}
								strokeWidth={2}
							/>
						);
					})}

					{/* Hover line */}
					{hoverX !== null && (
						<Line
							from={{ x: hoverX, y: 0 }}
							to={{ x: hoverX, y: innerHeight }}
							stroke="black"
							strokeDasharray="2,2"
						/>
					)}

					<rect
						x={0}
						y={0}
						width={innerWidth}
						height={innerHeight}
						fill="transparent"
						onMouseMove={handleMouseMove}
						onMouseLeave={handleMouseLeave}
					/>
				</Group>
			</svg>

			{tooltipData && (
				<Tooltip
					key={Math.random()}
					top={margin.top + 10}
					left={margin.left + (hoverX ?? 0) + 10}
					style={tooltipStyles}
				>
					<div>
						<strong>Estimated Skill: {tooltipData.rating.toFixed(1)}</strong>
						<hr />
						{tooltipData.densities
							.sort((a, b) => b.density - a.density)
							.map((d) => (
								<div key={d.name}>
									<span style={{ fontWeight: 600 }}>{d.name}</span>:{" "}
									{d.density.toPrecision(3)}
								</div>
							))}
					</div>
				</Tooltip>
			)}

			<div className="mt-4 flex flex-wrap gap-4">
				{distributions.map(({ player }) => {
					const color = colorScale(player.userId);
					return (
						<button
							key={player.userId}
							className="flex items-center cursor-pointer"
							onClick={() => togglePlayerVisibility(player.userId)}
							onKeyDown={(e) => handleToggleKeyDown(e, player.userId)}
							type="button"
							aria-label={`Toggle visibility for ${player.name}`}
						>
							<div
								className="w-4 h-4 mr-2"
								style={{
									backgroundColor: visiblePlayers[player.userId]
										? color
										: "#ccc",
								}}
							/>
							<span className="text-sm">
								{player.name} (μ: {player.currentRating.mu.toFixed(1)}, σ:{" "}
								{player.currentRating.sigma.toFixed(1)})
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
