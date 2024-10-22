"use client";

import { useRouter } from "next/navigation";
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
import { useState, useEffect } from "react";
import { useEntity, useQueryOne } from "@triplit/react";
import * as R from "remeda";

const sortedLeagueDivisions = R.reverse(leagueDivisionsSchema.options);

const schema = z
	.object({
		minLevel: leagueDivisionsSchema,
		maxLevel: leagueDivisionsSchema,
		confidenceLevel: z.number().min(1).max(10),
	})
	.refine(
		(data) => {
			const minIndex = sortedLeagueDivisions.indexOf(data.minLevel);
			const maxIndex = sortedLeagueDivisions.indexOf(data.maxLevel);
			return minIndex <= maxIndex;
		},
		{
			message: "Minimum level cannot be higher than maximum level",
			path: ["minLevel", "maxLevel"],
		},
	);

type FormValues = z.infer<typeof schema>;

type RegistrationFormProps = {
	eventId: string;
	leagueId: string;
	userId: string;
	defaultMinLevel: number;
	defaultMaxLevel: number;
};

export default function RegistrationForm({
	eventId,
	leagueId,
	userId,
	defaultMinLevel,
	defaultMaxLevel,
}: RegistrationFormProps) {
	const router = useRouter();
	const defaultMinLevelString = sortedLeagueDivisions[defaultMinLevel];
	const defaultMaxLevelString = sortedLeagueDivisions[defaultMaxLevel];

	const { result: user } = useEntity(client, "users", userId);
	const { result: existingRegistration } = useQueryOne(
		client,
		client
			.query("event_registrations")
			.where([
				["user_id", "=", userId],
				["event_id", "=", eventId],
			])
			.build(),
	);
	useEffect(() => {
		if (existingRegistration) {
			console.log("User already registered for event", {
				existingRegistration,
			});
			router.push(`/leagues/${leagueId}/events/${eventId}`);
		}
	}, [existingRegistration, router, eventId, leagueId]);

	const form = useForm({
		defaultValues: {
			minLevel: user?.default_min_opponent_level ?? defaultMinLevelString,
			maxLevel: user?.default_max_opponent_level ?? defaultMaxLevelString,
			confidenceLevel: 5,
		} as FormValues,
		onSubmit: async ({ value }) => {
			try {
				await client.insert("event_registrations", {
					id: `registration_${userId}-${eventId}`,
					user_id: userId,
					event_id: eventId,
					league_id: leagueId,
					created_at: new Date(),
					updated_at: new Date(),
					minimum_opponent_level: value.minLevel,
					max_opponent_level: value.maxLevel,
					confidence_level: value.confidenceLevel,
				});

				// Update user preferences
				await client.update("users", userId, (user) => {
					user.default_min_opponent_level = value.minLevel;
					user.default_max_opponent_level = value.maxLevel;
				});

				// Store confidence level in local storage only on successful submission
				localStorage.setItem(
					"confidenceLevel",
					value.confidenceLevel.toString(),
				);
				console.log("Event registration successful", {
					confidenceLevel: value.confidenceLevel,
					minLevel: value.minLevel,
					maxLevel: value.maxLevel,
					value,
				});

				router.push(`/leagues/${leagueId}/events/${eventId}`);
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

	useEffect(() => {
		const storedConfidence = localStorage.getItem("confidenceLevel");
		if (storedConfidence) {
			form.setFieldValue("confidenceLevel", Number(storedConfidence));
		}
	}, [form.setFieldValue]);

	const handleMinLevelChange = (value: LeagueDivision) => {
		const currentMax = form.getFieldValue("maxLevel");
		const minIndex = sortedLeagueDivisions.indexOf(value);
		const maxIndex = sortedLeagueDivisions.indexOf(currentMax);

		// Ensure maxLevel is not lower than minLevel
		const adjustedMax = minIndex > maxIndex ? value : currentMax;

		form.setFieldValue("minLevel", value);
		form.setFieldValue("maxLevel", adjustedMax);

		client.update("users", userId, (user) => {
			user.default_min_opponent_level = value;
			user.default_max_opponent_level = adjustedMax;
		});
	};

	const handleMaxLevelChange = (value: LeagueDivision) => {
		const currentMin = form.getFieldValue("minLevel");
		const minIndex = sortedLeagueDivisions.indexOf(currentMin);
		const maxIndex = sortedLeagueDivisions.indexOf(value);

		// Ensure minLevel is not higher than maxLevel
		const adjustedMin = maxIndex < minIndex ? value : currentMin;

		form.setFieldValue("minLevel", adjustedMin);
		form.setFieldValue("maxLevel", value);

		client.update("users", userId, (user) => {
			user.default_min_opponent_level = adjustedMin;
			user.default_max_opponent_level = value;
		});
	};

	return (
		<Card className="mt-8">
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
										name="minLevel"
										onValueChange={handleMinLevelChange}
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
										name="maxLevel"
										onValueChange={handleMaxLevelChange}
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
