"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
	value: string;
	label: string;
}

interface ComboBoxProps {
	options: Option[];
	value?: string;
	onChange: (value: string) => void;
	placeholder: string;
	searchPlaceholder: string;
	emptyText: string;
}

export function ComboBox({
	options,
	value,
	onChange,
	placeholder,
	searchPlaceholder,
	emptyText,
}: ComboBoxProps) {
	const [open, setOpen] = React.useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const selected = options.find((option) => option.value === value);

	const OptionsList = React.useCallback(
		function OptionsList() {
			return (
				<Command
					filter={(currentOption, search) => {
						if (!search) return 1;
						const normalizedSearch = search.toLowerCase().trim();
						const option = options.find((opt) => opt.value === currentOption);
						if (!option) return 0;

						const normalizedLabel = option.label.toLowerCase().trim();
						return normalizedLabel.includes(normalizedSearch) ? 1 : 0;
					}}
				>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyText}</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.value}
									onSelect={(value) => {
										onChange(value);
										setOpen(false);
									}}
								>
									{option.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			);
		},
		[options, onChange, searchPlaceholder, emptyText],
	);

	if (isDesktop) {
		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button variant="outline" className="w-full justify-start">
						{selected ? selected.label : placeholder}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0" align="start">
					<OptionsList />
				</PopoverContent>
			</Popover>
		);
	}

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>
				<Button variant="outline" className="w-full justify-start">
					{selected ? selected.label : placeholder}
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<div className="mt-4 border-t">
					<OptionsList />
				</div>
			</DrawerContent>
		</Drawer>
	);
}
