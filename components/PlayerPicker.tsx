"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { client } from "@/lib/triplit";
import { useQuery } from "@triplit/react";

type PlayerPickerProps =
	| {
			value: string;
			onChange: (value: string) => void;
			multiple?: false;
	  }
	| {
			value: string[];
			onChange: (value: string[]) => void;
			multiple: true;
	  };

export function PlayerPicker({ multiple, value, onChange }: PlayerPickerProps) {
	const { results: users } = useQuery(client, client.query("users"));

	const options =
		users?.map((user) => ({
			label: `${user.first_name} ${user.last_name}`,
			value: user.id,
		})) ?? [];

	if (multiple) {
		return (
			<MultiSelect
				options={options}
				onValueChange={onChange}
				value={value}
				placeholder="Select players"
			/>
		);
	}

	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select player" />
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
