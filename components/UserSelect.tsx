"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@triplit/react";
import { client } from "@/lib/triplit";
import Image from "next/image";

interface UserSelectProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (value: string) => void;
	value?: string;
}

export function UserSelect({
	open,
	onOpenChange,
	onSelect,
	value,
}: UserSelectProps) {
	const { results: users } = useQuery(
		client,
		client
			.query("users")
			.select(["id", "first_name", "last_name", "email", "profile_image_url"]),
	);

	const userOptions =
		users?.map((user) => ({
			value: user.id,
			label: `${user.first_name} ${user.last_name}`,
			image: user.profile_image_url,
		})) ?? [];

	const selectedUser = userOptions.find((user) => user.value === value);

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					aria-expanded={open}
					className="w-[200px] justify-between"
				>
					{selectedUser ? (
						<div className="flex items-center gap-2">
							<Image
								src={selectedUser.image ?? "/default-avatar.png"}
								alt={selectedUser.label}
								width={24}
								height={24}
								className="rounded-full"
							/>
							{selectedUser.label}
						</div>
					) : (
						"Select user..."
					)}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search users..." />
					<CommandEmpty>No users found.</CommandEmpty>
					<CommandGroup className="max-h-[200px] overflow-y-auto">
						{userOptions.map((user) => (
							<CommandItem
								key={user.value}
								value={user.value}
								onSelect={(currentValue) => {
									onSelect(currentValue);
								}}
							>
								<div className="flex items-center gap-2">
									<Image
										src={user.image ?? "/default-avatar.png"}
										alt={user.label}
										width={24}
										height={24}
										className="rounded-full"
									/>
									{user.label}
								</div>
								<Check
									className={cn(
										"ml-auto h-4 w-4",
										value === user.value ? "opacity-100" : "opacity-0",
									)}
								/>
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
