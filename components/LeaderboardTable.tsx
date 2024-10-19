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
import { useQuery } from "@triplit/react";
import type { Entity } from "@triplit/client";
import type { schema } from "@/triplit/schema";
import {
	PaginationNumbers,
	CompactPaginationNumbers,
} from "./PaginationComponents";

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
		},
	),
	columnHelper.accessor("rating", {
		header: "Pts",
		cell: (info) => info.getValue(),
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

export default function LeaderboardTable() {
	const [{ pageIndex, pageSize }, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");

	const memoizedColumns = useMemo(() => columns, []);

	const playersQuery = client
		.query("users")
		.select([
			"id",
			"email",
			"first_name",
			"last_name",
			"gender",
			"matches_played",
			"wins",
			"losses",
			"no_shows",
			"rating",
		])
		.order("rating", "DESC");

	const { results, fetching, error } = useQuery(client, playersQuery);

	const table = useReactTable({
		data: results ?? [],
		columns: memoizedColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		state: {
			pagination: {
				pageIndex,
				pageSize,
			},
			columnFilters,
			globalFilter,
			columnVisibility: {
				gender: false,
			},
		},
		onPaginationChange: setPagination,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: "includesString",
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

	return (
		<>
			<div className="flex justify-between mb-4 gap-4">
				<Input
					placeholder="Search players..."
					value={globalFilter}
					onChange={handleGlobalFilterChange}
					className="max-w-sm"
				/>
				<Select onValueChange={handleGenderFilterChange}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Filter by gender" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="Male">Male</SelectItem>
						<SelectItem value="Female">Female</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="flex-grow overflow-auto">
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
							<TableRow key={row.id}>
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
					Showing {table.getRowModel().rows.length} of {results?.length ?? 0}{" "}
					players
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
