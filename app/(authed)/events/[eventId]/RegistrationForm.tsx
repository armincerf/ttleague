"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { leagueDivisionsSchema, type LeagueDivision } from "@/lib/ratingSystem";
import { client } from "@/lib/triplit";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Slider } from "@/components/ui/slider";
import {
	FormControl,
	FormDescription,
	FormItem,
	FormLabel,
} from "@/components/ui/form";

const sortedLeagueDivisions = leagueDivisionsSchema.options.reverse();

const schema = z.object({
	minLevel: leagueDivisionsSchema,
	maxLevel: leagueDivisionsSchema,
	confidenceLevel: z.number().min(1).max(10),
});

type FormValues = z.infer<typeof schema>;

type RegistrationFormProps = {
	eventId: string;
	userId: string;
	defaultMinLevel: LeagueDivision;
	defaultMaxLevel: LeagueDivision;
};

export default function RegistrationForm({
	eventId,
	userId,
	defaultMinLevel,
	defaultMaxLevel,
}: RegistrationFormProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const form = useForm({
		defaultValues: {
			minLevel:
				(searchParams.get("minLevel") as LeagueDivision) || defaultMinLevel,
			maxLevel:
				(searchParams.get("maxLevel") as LeagueDivision) || defaultMaxLevel,
			confidenceLevel: 5,
		} as FormValues,
		onSubmit: async ({ value }) => {
			try {
				await client.insert("event_registrations", {
					user_id: userId,
					event_id: eventId,
					created_at: new Date(),
					minimum_opponent_level: value.minLevel,
					max_opponent_level: value.maxLevel,
					confidence_level: value.confidenceLevel,
				});
				router.refresh();
			} catch (error) {
				console.error("Error registering for event:", error);
				// Handle error (e.g., show error message to user)
			}
		},
		validatorAdapter: zodValidator(),
		validators: {
			onSubmit: schema,
		},
	});

	function updateUrl(min: LeagueDivision, max: LeagueDivision) {
		const params = new URLSearchParams(searchParams);
		params.set("minLevel", min);
		params.set("maxLevel", max);
		router.push(`?${params.toString()}`, { scroll: false });
	}

	function handleMinLevelChange(value: LeagueDivision) {
		const maxLevel = form.getFieldValue("maxLevel");
		const newMax =
			sortedLeagueDivisions.indexOf(value) >
			sortedLeagueDivisions.indexOf(maxLevel)
				? value
				: maxLevel;
		updateUrl(value, newMax);
	}

	function handleMaxLevelChange(value: LeagueDivision) {
		const minLevel = form.getFieldValue("minLevel");
		const newMin =
			sortedLeagueDivisions.indexOf(value) <
			sortedLeagueDivisions.indexOf(minLevel)
				? value
				: minLevel;
		updateUrl(newMin, value);
	}

	return (
		<Card className="mt-6">
			<CardHeader>
				<CardTitle>Register for Event</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={form.handleSubmit} className="space-y-6">
					<form.Field name="minLevel">
						{(field) => (
							<FormItem>
								<FormLabel>Minimum Opponent Level</FormLabel>
								<FormControl>
									<Select
										onValueChange={(value) => {
											field.handleChange(value as LeagueDivision);
											handleMinLevelChange(value as LeagueDivision);
										}}
										value={field.state.value}
									>
										<SelectTrigger id="min-level">
											<SelectValue placeholder="Select minimum level" />
										</SelectTrigger>
										<SelectContent>
											{sortedLeagueDivisions.map((level) => (
												<SelectItem key={level} value={level}>
													{level}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
							</FormItem>
						)}
					</form.Field>

					<form.Field name="maxLevel">
						{(field) => (
							<FormItem>
								<FormLabel>Maximum Opponent Level</FormLabel>
								<FormControl>
									<Select
										onValueChange={(value) => {
											field.handleChange(value as LeagueDivision);
											handleMaxLevelChange(value as LeagueDivision);
										}}
										value={field.state.value}
									>
										<SelectTrigger id="max-level">
											<SelectValue placeholder="Select maximum level" />
										</SelectTrigger>
										<SelectContent>
											{sortedLeagueDivisions.map((level) => (
												<SelectItem key={level} value={level}>
													{level}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
							</FormItem>
						)}
					</form.Field>

					<form.Field name="confidenceLevel">
						{(field) => (
							<FormItem>
								<FormLabel>Confidence in Current Form</FormLabel>
								<FormControl>
									<Slider
										min={1}
										max={10}
										step={1}
										value={[field.state.value]}
										onValueChange={(value) => field.handleChange(value[0])}
									/>
								</FormControl>
								<FormDescription>
									Adjust this slider based on how confident you feel about your
									current form. A higher confidence level means you can win more
									ranking points, but you also risk losing more if defeated.
									Choose a lower number if you are injured or not in form and
									don't want to risk losing too many points.
								</FormDescription>
							</FormItem>
						)}
					</form.Field>

					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit} className="w-full">
								{isSubmitting ? "Registering..." : "Register"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
		</Card>
	);
}
