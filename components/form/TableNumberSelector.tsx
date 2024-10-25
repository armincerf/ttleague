import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";

type TableNumberSelectorProps =
	| {
			value: number;
			onChange: (value: number) => void;
			maxTables?: number;
			label?: string;
			multiple?: false;
	  }
	| {
			value: number[];
			onChange: (value: number[]) => void;
			maxTables?: number;
			label?: string;
			multiple: true;
	  };

export function TableNumberSelector({
	value,
	onChange,
	maxTables = 4,
	label = "Table Number",
	multiple,
}: TableNumberSelectorProps) {
	const isSelected = (table: number) =>
		multiple ? value.includes(table) : value === table;

	const handleClick = (table: number) => {
		if (multiple) {
			if (value.includes(table)) {
				onChange(value.filter((t) => t !== table)); // Remove table if it's already selected
			} else {
				onChange([...value, table]); // Add table to the selection
			}
		} else {
			onChange(table); // Single selection
		}
	};

	return (
		<FormItem>
			<FormLabel>{label}</FormLabel>
			<FormControl>
				<div className="grid grid-cols-4 gap-2 mt-2">
					{Array.from({ length: maxTables }, (_, i) => i + 1).map((table) => (
						<Button
							key={table}
							type="button"
							variant="outline"
							className={cn(
								"h-12 w-12",
								isSelected(table) && "bg-primary text-primary-foreground",
							)}
							onClick={() => handleClick(table)}
						>
							{table}
						</Button>
					))}
				</div>
			</FormControl>
		</FormItem>
	);
}
