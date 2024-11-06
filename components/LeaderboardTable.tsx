"use client";

import { useState, useMemo } from "react";
import {
	useReactTable,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	flexRender,
	createColumnHelper,
	type Row,
	type ColumnFiltersState,
	getSortedRowModel,
	type SortingState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { client } from "@/lib/triplit";
import { useEntity, useQuery } from "@triplit/react";
import type { Entity } from "@triplit/client";
import type { schema } from "@/triplit/schema";
import {
	PaginationNumbers,
	CompactPaginationNumbers,
} from "./PaginationComponents";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type User = Entity<typeof schema, "users">;

const columnHelper = createColumnHelper<User>();

const columns = [
	columnHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
		id: "name",
		header: "Player",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("matches_played", {
		header: "P",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("wins", {
		header: "W",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("losses", {
		header: "L",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor(
		(row) => {
			const total = row.wins + row.losses;
			return total > 0 ? (row.wins / total) * 100 : 0;
		},
		{
			id: "winRate",
			header: "WR%",
			cell: (info) => `${info.getValue().toFixed(1)}%`,
			sortingFn: (rowA, rowB) => {
				const totalA = rowA.original.wins + rowA.original.losses;
				const totalB = rowB.original.wins + rowB.original.losses;
				const wrA = totalA > 0 ? (rowA.original.wins / totalA) * 100 : 0;
				const wrB = totalB > 0 ? (rowB.original.wins / totalB) * 100 : 0;

				if (wrA === wrB) {
					return totalB - totalA; // Secondary sort by total games played
				}
				return wrB - wrA;
			},
		},
	),
	columnHelper.accessor("rating", {
		header: "Pts",
		cell: (info) => {
			const row = info.row.original;
			const gamesPlayed = row.wins + row.losses;
			if (gamesPlayed === 0) return "";
			return "-";
		},
	}),
	columnHelper.accessor("gender", {
		header: "Gender",
		enableHiding: true,
		cell: (info) => info.getValue(),
		filterFn: (row, id, filterValue) => {
			if (filterValue === "all" || !filterValue) return true;
			return row.getValue(id) === filterValue.toLowerCase();
		},
	}),
];

const COLUMNS = 6;
const ROWS = 10;

interface LeaderboardTableProps {
	initialUsers: User[];
}

export default function LeaderboardTable({
	initialUsers,
}: LeaderboardTableProps) {
	"use no memo";
	const router = useRouter();
	const [{ pageIndex, pageSize }, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [sorting, setSorting] = useState<SortingState>([
		{
			id: "winRate",
			desc: true,
		},
	]);

	const memoizedColumns = useMemo(() => columns, []);

	const { results, fetching, error } = useQuery(
		client,
		client.query("users").order("wins", "DESC"),
	);

	const tableData = useMemo(() => {
		if (fetching) return initialUsers;
		return results && results.length >= initialUsers.length
			? results
			: initialUsers;
	}, [results, initialUsers, fetching]);

	const table = useReactTable({
		data: tableData,
		columns: memoizedColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			pagination: {
				pageIndex,
				pageSize,
			},
			columnFilters,
			globalFilter,
			sorting,
			columnVisibility: {
				gender: false,
			},
		},
		onPaginationChange: setPagination,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: setSorting,
		globalFilterFn: "includesString",
		enableSorting: true,
	});

	function handleGlobalFilterChange(
		event: React.ChangeEvent<HTMLInputElement>,
	) {
		setGlobalFilter(event.target.value);
	}

	function handleGenderFilterChange(value: string) {
		table.getColumn("gender")?.setFilterValue(value === "all" ? null : value);
	}

	function getVisiblePages(currentPage: number, totalPages: number) {
		if (totalPages <= 5) {
			return Array.from({ length: totalPages }, (_, i) => i);
		}

		if (currentPage <= 2) {
			return [0, 1, 2, null, totalPages - 1];
		}

		if (currentPage >= totalPages - 3) {
			return [0, null, totalPages - 3, totalPages - 2, totalPages - 1];
		}

		return [
			0,
			null,
			currentPage - 1,
			currentPage,
			currentPage + 1,
			null,
			totalPages - 1,
		];
	}

	// Show skeleton if fetching or if there are no results yet
	if (error) {
		return <div>Error loading leaderboard: {error.message}</div>;
	}

	return (
		<>
			<div className="flex justify-between mb-4 gap-4">
				<Input
					placeholder="Search players..."
					value={globalFilter}
					onChange={handleGlobalFilterChange}
					className="max-w-sm"
				/>
				{/* <Select onValueChange={handleGenderFilterChange}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Filter by gender" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="Male">Male</SelectItem>
						<SelectItem value="Female">Female</SelectItem>
					</SelectContent>
				</Select> */}
			</div>
			<div className="flex-grow overflow-auto">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className={
											header.column.getCanSort()
												? "cursor-pointer select-none"
												: ""
										}
										onClick={header.column.getToggleSortingHandler()}
									>
										<div className="flex items-center gap-1">
											{flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
											{header.column.getCanSort() && (
												<span className="text-muted-foreground">
													{header.column.getIsSorted() === "desc" ? (
														<ArrowDown className="h-3 w-3" />
													) : header.column.getIsSorted() === "asc" ? (
														<ArrowUp className="h-3 w-3" />
													) : (
														<ArrowUpDown className="h-3 w-3" />
													)}
												</span>
											)}
										</div>
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								onClick={() => router.push(`/users/${row.original.id}`)}
								className="cursor-pointer"
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:space-x-4 pb-6">
				<div className="text-sm text-muted-foreground">
					Showing {table.getRowModel().rows.length} of {tableData.length}{" "}
					players
					{fetching && " (updating...)"}
				</div>
				<Pagination className="w-full md:w-auto">
					<PaginationContent className="w-full justify-between">
						<PaginationItem>
							<PaginationPrevious
								onClick={() =>
									table.getCanPreviousPage() && table.previousPage()
								}
								disabled={!table.getCanPreviousPage()}
							/>
						</PaginationItem>
						<div className="flex-1 flex justify-center items-center">
							<CompactPaginationNumbers
								currentPage={table.getState().pagination.pageIndex}
								totalPages={table.getPageCount()}
								onPageChange={table.setPageIndex}
							/>
							<PaginationNumbers
								currentPage={table.getState().pagination.pageIndex}
								totalPages={table.getPageCount()}
								onPageChange={table.setPageIndex}
							/>
						</div>
						<PaginationItem>
							<PaginationNext
								onClick={() => table.getCanNextPage() && table.nextPage()}
								disabled={!table.getCanNextPage()}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		</>
	);
}

interface SkeletonProps {
	className?: string;
}

function TableHeaderSkeleton({ className }: SkeletonProps) {
	return <Skeleton className={`h-6 w-full ${className}`} />;
}

function TableCellSkeleton({ className }: SkeletonProps) {
	return <Skeleton className={`h-6 w-full ${className}`} />;
}

interface LeaderboardSkeletonProps {
	columns: number;
	rows: number;
}

function LeaderboardSkeleton({ columns, rows }: LeaderboardSkeletonProps) {
	return (
		<>
			<div className="flex justify-between mb-4 gap-4">
				<Skeleton className="h-10 w-[200px]" />
				<Skeleton className="h-10 w-[180px]" />
			</div>
			<div className="flex-grow overflow-auto">
				<Table>
					<TableHeader>
						<TableRow>
							{Array.from({ length: columns }).map((_, i) => (
								<TableHead
									key={`header-${
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										i
									}`}
								>
									<TableHeaderSkeleton />
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{Array.from({ length: rows }).map((_, rowIndex) => (
							<TableRow
								key={`row-${
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									rowIndex
								}`}
							>
								{Array.from({ length: columns }).map((_, colIndex) => (
									<TableCell
										key={`cell-${rowIndex}-${
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											colIndex
										}`}
									>
										<TableCellSkeleton />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:space-x-4 pb-6">
				<Skeleton className="h-6 w-[200px]" />
				<Skeleton className="h-10 w-full md:w-[300px]" />
			</div>
		</>
	);
}
