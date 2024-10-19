import { PaginationItem, PaginationLink } from "@/components/ui/pagination";

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

function getCompactVisiblePages(currentPage: number, totalPages: number) {
	if (totalPages <= 3) {
		return Array.from({ length: totalPages }, (_, i) => i);
	}

	if (currentPage === 0) {
		return [0, 1, null, totalPages - 1];
	}

	if (currentPage === totalPages - 1) {
		return [0, null, totalPages - 2, totalPages - 1];
	}

	return [0, null, currentPage, null, totalPages - 1];
}

interface PaginationNumbersProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

export function PaginationNumbers({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationNumbersProps) {
	return (
		<div className="hidden xxs:flex justify-center items-center">
			{getVisiblePages(currentPage, totalPages).map((page, index) => (
				<PaginationItem key={`full-${page ?? `${index}...`}`}>
					{page === null ? (
						<span>...</span>
					) : (
						<PaginationLink
							onClick={() => onPageChange(page)}
							isActive={page === currentPage}
						>
							{page + 1}
						</PaginationLink>
					)}
				</PaginationItem>
			))}
		</div>
	);
}

export function CompactPaginationNumbers({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationNumbersProps) {
	return (
		<div className="xxs:hidden flex justify-center items-center">
			{getCompactVisiblePages(currentPage, totalPages).map((page, index) => (
				<PaginationItem key={`compact-${page ?? `${index}...`}`}>
					{page === null ? (
						<span className="px-1">...</span>
					) : (
						<PaginationLink
							onClick={() => onPageChange(page)}
							isActive={page === currentPage}
						>
							{page + 1}
						</PaginationLink>
					)}
				</PaginationItem>
			))}
		</div>
	);
}
