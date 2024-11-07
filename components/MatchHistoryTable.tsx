"use client";

import { Fragment, useState, useEffect } from "react";
import {
	useReactTable,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	getExpandedRowModel,
	flexRender,
	createColumnHelper,
	type SortingState,
	type ExpandedState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ChevronRight, ChevronDown, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { MatchScoreCard, type MatchScore } from "./MatchScoreCard";
import type { User } from "@/triplit/schema";
import { getDivision } from "@/lib/ratingSystem";
import type { Match } from "@/app/(authed)/users/[userId]/page";

const columnHelper = createColumnHelper<Match>();

function createMatchFilter(match: Match, filterValue: string): boolean {
	const searchTerm = filterValue.toLowerCase();

	// Search player names
	const player =
		`${match.player.first_name} ${match.player.last_name}`.toLowerCase();
	const opponent =
		`${match.opponent.first_name} ${match.opponent.last_name}`.toLowerCase();

	// Search scores
	const scoresString = match.scores
		.map((score) => `${score.player1Points}-${score.player2Points}`)
		.join(" ");

	return (
		player.includes(searchTerm) ||
		opponent.includes(searchTerm) ||
		scoresString.includes(searchTerm)
	);
}

const columns = [
	columnHelper.display({
		id: "expander",
		header: ({ table }) => (
			<button
				type="button"
				onClick={table.getToggleAllRowsExpandedHandler()}
				className="p-2 hover:bg-gray-100 rounded-full transition-colors"
			>
				{table.getIsAllRowsExpanded() ? (
					<ChevronDown className="h-4 w-4" />
				) : (
					<ChevronRight className="h-4 w-4" />
				)}
			</button>
		),
		cell: ({ row }) => {
			if (!row.getCanExpand()) return null;
			return (
				<button
					type="button"
					onClick={row.getToggleExpandedHandler()}
					className="p-2 hover:bg-gray-100 rounded-full transition-colors"
				>
					{row.getIsExpanded() ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					)}
				</button>
			);
		},
	}),
	columnHelper.accessor("date", {
		header: ({ column }) => (
			<div className="flex items-center gap-2">
				<span>Date</span>
				<button
					type="button"
					onClick={column.getToggleSortingHandler()}
					className={column.getCanSort() ? "cursor-pointer" : ""}
				>
					<ArrowUpDown className="h-4 w-4" />
				</button>
			</div>
		),
		cell: (info) => format(info.getValue(), "dd MMM yyyy"),
	}),
	columnHelper.accessor("opponent", {
		header: "Opponent",
		cell: (info) =>
			`${info.getValue().first_name} ${info.getValue().last_name}`,
	}),
	columnHelper.accessor("result", {
		header: "Result",
		cell: (info) => (
			<span
				className={
					info.getValue() === "win" ? "text-green-600" : "text-red-600"
				}
			>
				{info.getValue().toUpperCase()}
			</span>
		),
	}),
	columnHelper.accessor("ratingChange", {
		header: "Pts",
		cell: (info) => {
			return <span className="text-gray-600">-</span>;
		},
	}),
	columnHelper.accessor("isManuallyCreated", {
		header: "Manual",
		cell: (info) =>
			info.getValue() ? (
				<span className="text-amber-600">Yes</span>
			) : (
				<span className="text-gray-600">No</span>
			),
	}),
];

interface MatchHistoryTableProps {
	matches: Match[];
	currentUserId: string;
	pageSize?: number;
}

export default function MatchHistoryTable({
	matches,
	currentUserId,
	pageSize = 10,
}: MatchHistoryTableProps) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const [sorting, setSorting] = useState<SortingState>([
		{ id: "date", desc: true },
	]);
	const [expanded, setExpanded] = useState<ExpandedState>({});
	const [globalFilter, setGlobalFilter] = useState("");
	const [{ pageIndex }, setPagination] = useState({
		pageIndex: 0,
		pageSize,
	});

	const table = useReactTable({
		data: matches,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		state: {
			sorting,
			expanded,
			globalFilter,
			pagination: {
				pageIndex,
				pageSize,
			},
		},
		onSortingChange: setSorting,
		onExpandedChange: setExpanded,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		getRowCanExpand: () => true,
		globalFilterFn: (row, columnId, filterValue) => {
			return createMatchFilter(row.original, filterValue);
		},
	});
	if (!isMounted) {
		return null; // Or a loading skeleton
	}
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Input
					placeholder="Search matches..."
					value={globalFilter}
					onChange={(e) => setGlobalFilter(e.target.value)}
					className="max-w-sm"
				/>
				<div className="text-sm text-muted-foreground">
					{table.getFilteredRowModel().rows.length} matches
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<Fragment key={row.id}>
								<TableRow
									className={row.getIsExpanded() ? "bg-gray-50" : undefined}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
								{row.getIsExpanded() && (
									<TableRow>
										<TableCell colSpan={row.getVisibleCells().length}>
											<div className="px-4 py-2 bg-gray-50">
												<MatchScoreCard
													player1={{
														id: row.original.player.id,
														name: `${row.original.player.first_name} ${row.original.player.last_name}`,
														division: getDivision(
															row.original.player.current_division,
														),
														rating: row.original.player.rating,
													}}
													player2={{
														id: row.original.opponent.id,
														name: `${row.original.opponent.first_name} ${row.original.opponent.last_name}`,
														division: getDivision(
															row.original.opponent.current_division,
														),
														rating: row.original.opponent.rating,
													}}
													scores={row.original.scores}
													bestOf={row.original.bestOf}
													table={row.original.table}
													leagueName="MK Singles League"
													eventDate={row.original.date}
													isManuallyCreated={row.original.isManuallyCreated}
													umpire={
														row.original.umpire
															? `${row.original.umpire.first_name} ${row.original.umpire.last_name}`
															: "None"
													}
												/>
											</div>
										</TableCell>
									</TableRow>
								)}
							</Fragment>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
