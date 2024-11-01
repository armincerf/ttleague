"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { useUser, useAuth } from "@clerk/nextjs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	FormControl,
	FormDescription,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { client } from "@/lib/triplit";
import {
	getDivision,
	initialRating,
	leagueDivisionsSchema,
} from "@/lib/ratingSystem";
import { ProfileImageUpload } from "./ProfileUpload";
import { onboardingSchema, type OnboardingFormValues } from "../schema";
import { toast } from "@/hooks/use-toast";
import { HttpClient } from "@triplit/client";
import { schema } from "@/triplit/schema";
import { usePostHog } from "posthog-js/react";

export default function OnboardingForm() {
	const { user } = useUser();
	const router = useRouter();
	const posthog = usePostHog();
	const searchParams = new URLSearchParams(
		typeof window !== "undefined" ? window.location.search : "",
	);
	const { getToken } = useAuth();

	const form = useForm({
		defaultValues: {
			email:
				searchParams.get("email") ||
				user?.primaryEmailAddress?.emailAddress ||
				"",
			firstName: searchParams.get("firstName") || user?.firstName || "",
			lastName: searchParams.get("lastName") || user?.lastName || "",
			currentLeagueDivision: getDivision(
				searchParams.get("currentLeagueDivision") || "Not in a league",
			),
			tableTennisEnglandId: searchParams.get("tableTennisEnglandId") || "",
		} satisfies OnboardingFormValues,
		onSubmit: async ({ value }) => {
			console.log("value", value, user);
			if (!user) {
				return;
			}
			try {
				const token = await getToken();
				if (!token) {
					throw new Error("No token available");
				}
				const client = new HttpClient({
					schema,
					serverUrl: process.env.NEXT_PUBLIC_TRIPLIT_SERVER_URL,
					token,
				});

				const result = await client.insert("users", {
					id: user.id,
					table_tennis_england_id: value.tableTennisEnglandId,
					email: value.email,
					first_name: value.firstName,
					profile_image_url: user.imageUrl,
					last_name: value.lastName,
					rating: initialRating(value.currentLeagueDivision),
					current_division: value.currentLeagueDivision,
					registered_league_ids: new Set(["mk-ttl-singles"]),
					matches_played: 0,
					wins: 0,
					losses: 0,
					no_shows: 0,
				});
				if (result.output.email === value.email) {
					router.push("/onboarding/next-event/mk-ttl-singles");
				}
			} catch (error) {
				console.error("Error during onboarding:", error);
				toast({
					variant: "destructive",
					title: "Error saving your details",
					description: "Please try again later",
				});
			}
		},
		validatorAdapter: zodValidator(),
		validators: {
			onSubmit: onboardingSchema,
		},
	});

	function updateUrlWithFormState(
		fieldName: keyof OnboardingFormValues,
		value: string,
	) {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			params.set(fieldName, value);
			router.replace(`?${params.toString()}`, { scroll: false });
		}
	}

	return (
		<Card className="w-[90vw] sm:w-full max-w-[450px] mx-auto mt-8 px-4 sm:px-0">
			<CardHeader>
				<CardTitle>Onboarding</CardTitle>
				<CardDescription>Complete your profile to get started</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
					className="space-y-6"
				>
					<form.Field name="firstName">
						{(field) => (
							<FormItem>
								<FormLabel>First Name</FormLabel>
								<FormControl>
									<Input
										defaultValue={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => {
											field.handleChange(e.target.value);
											updateUrlWithFormState("firstName", e.target.value);
										}}
										autoComplete="given-name"
									/>
								</FormControl>
								{field.state.meta.errors && (
									<p className="text-sm text-red-500">
										{field.state.meta.errors.join(", ")}
									</p>
								)}
							</FormItem>
						)}
					</form.Field>

					<form.Field name="lastName">
						{(field) => (
							<FormItem>
								<FormLabel>Last Name</FormLabel>
								<FormControl>
									<Input
										defaultValue={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => {
											field.handleChange(e.target.value);
											updateUrlWithFormState("lastName", e.target.value);
										}}
										autoComplete="family-name"
									/>
								</FormControl>
								{field.state.meta.errors && (
									<p className="text-sm text-red-500">
										{field.state.meta.errors.join(", ")}
									</p>
								)}
							</FormItem>
						)}
					</form.Field>

					<form.Field name="currentLeagueDivision">
						{(field) => (
							<FormItem>
								<FormLabel>Current League Division (Optional)</FormLabel>
								<FormControl>
									<Select
										value={field.state.value || "Not in a league"}
										onValueChange={(value) => {
											field.handleChange(getDivision(value));
											updateUrlWithFormState("currentLeagueDivision", value);
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select division" />
										</SelectTrigger>
										<SelectContent>
											{leagueDivisionsSchema.options.map((division) => (
												<SelectItem key={division} value={division}>
													{division}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormDescription>
									This is used to set your initial ranking points and match you
									with players of a similar level.
								</FormDescription>
								{field.state.meta.errors && (
									<p className="text-sm text-red-500">
										{field.state.meta.errors.join(", ")}
									</p>
								)}
							</FormItem>
						)}
					</form.Field>
					<ProfileImageUpload />
					<div className="flex justify-end space-x-2">
						<form.Subscribe
							selector={(state) => [
								state.canSubmit,
								state.isSubmitting,
								state.errors,
							]}
						>
							{([canSubmit, isSubmitting, errors]) => {
								return (
									<>
										<Button
											type="submit"
											disabled={!canSubmit || !!isSubmitting}
											data-umami-event="Submit Onboarding"
											data-umami-event-league-division={form.getFieldValue(
												"currentLeagueDivision",
											)}
											data-umami-event-table-tennis-england-id={form.getFieldValue(
												"tableTennisEnglandId",
											)}
										>
											{isSubmitting ? "Saving..." : "Save"}
										</Button>
										{Object.keys(errors).length > 0 && (
											<p className="text-sm text-red-500">
												Please fix the errors above
											</p>
										)}
									</>
								);
							}}
						</form.Subscribe>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
