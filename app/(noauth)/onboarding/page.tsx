"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useSignIn } from "@clerk/nextjs";
import type { Clerk } from "@clerk/types";
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
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { getCroppedImg } from "@/lib/canvasUtils";
import { Slider } from "@/components/ui/slider";
import { useDropzone } from "react-dropzone";
import { FileIcon, UploadIcon } from "lucide-react";
import { z } from "zod";
import { checkAccountExists, client } from "@/lib/triplit";
import {
	getDivision,
	initialRating,
	leagueDivisionsSchema,
} from "@/lib/ratingSystem";

const schema = z.object({
	email: z.string().email(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	currentLeagueDivision: leagueDivisionsSchema.optional(),
	tableTennisEnglandId: z.string().regex(/^\d{6}$/, "Must be a 6-digit number"),
	profilePicture: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof schema>;

// Add this type declaration at the top of your file, outside of any function
declare global {
	interface Window {
		Clerk: Clerk;
	}
}

export default function Onboarding() {
	const [profileImage, setProfileImage] = useState<string | null>(null);
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
	const [isCropperOpen, setIsCropperOpen] = useState(false);

	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useUser();
	console.log("user", user);

	const form = useForm({
		defaultValues: {
			email:
				searchParams.get("email") ||
				user?.primaryEmailAddress?.emailAddress ||
				"",
			firstName: searchParams.get("firstName") || user?.firstName || "",
			lastName: searchParams.get("lastName") || user?.lastName || "",
			currentLeagueDivision: getDivision(
				searchParams.get("currentLeagueDivision") || "",
			),
			tableTennisEnglandId: searchParams.get("tableTennisEnglandId") || "",
		} as FormValues,
		onSubmit: async ({ value }) => {
			try {
				console.log("submitting", value, user);
				await user?.update({
					firstName: value.firstName,
					lastName: value.lastName,
				});
				if (user?.id) {
					try {
						const clerk = window.Clerk;
						const token = await clerk.session?.getToken();
						if (token) {
							client.updateToken(token);
							const tx = await client.http.insert("users", {
								id: user.id,
								table_tennis_england_id: value.tableTennisEnglandId,
								email: value.email,
								first_name: value.firstName,
								last_name: value.lastName,
								rating: initialRating(value.currentLeagueDivision),
								matches_played: 0,
								wins: 0,
								losses: 0,
								no_shows: 0,
							});
							console.log("tx", tx);

							router.push("/leaderboard");
						} else {
							console.error("No token available");
						}
					} catch (error) {
						console.error("Error inserting user:", error);
					}
				}
			} catch (error) {
				console.error("Error during onboarding:", JSON.stringify(error));
				// You might want to show an error message to the user here
			}
		},
		validatorAdapter: zodValidator(),
		validators: {
			onSubmit: schema,
		},
	});

	const onCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
		setCroppedAreaPixels(croppedAreaPixels);
	};

	const showCroppedImage = async () => {
		try {
			if (imageSrc && croppedAreaPixels) {
				const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
				if (croppedImage) {
					setProfileImage(croppedImage);
					// Upload image to Clerk
					const response = await fetch(croppedImage);
					const blob = await response.blob();
					const file = new File([blob], "profile_picture.png", {
						type: "image/png",
					});
					await user?.setProfileImage({ file });
				}
			}
		} catch (e) {
			console.error(e);
		}
		setIsCropperOpen(false);
	};

	const fileInputRef = useRef<HTMLInputElement>(null);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (file) {
			handleFileSelection(file);
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { "image/*": [] },
		multiple: false,
	});

	function handleFileSelection(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => {
			setImageSrc(e.target?.result as string);
			setIsCropperOpen(true);
		};
		reader.readAsDataURL(file);
	}

	useEffect(() => {
		if (user?.primaryEmailAddress?.emailAddress) {
			checkAccountExists(user.primaryEmailAddress.emailAddress).then(
				(exists) => {
					if (exists) {
						console.log("account exists, redirecting to leaderboard");
						router.push("/leaderboard");
					}
				},
			);
		}
	}, [user, router]);

	// Function to update URL with form state
	function updateUrlWithFormState(fieldName: keyof FormValues, value: string) {
		const params = new URLSearchParams(searchParams.toString());
		params.set(fieldName, value);
		router.replace(`?${params.toString()}`, { scroll: false });
	}

	if (!user) {
		return <div>Loading...</div>;
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
					<form.Field name="email">
						{(field) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="Email"
										value={field.state.value}
										disabled
										autoComplete="email"
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

					<form.Field
						name="firstName"
						validators={{
							onChange: ({ value }) =>
								schema.shape.firstName.safeParse(value).success
									? undefined
									: "First name is required",
						}}
					>
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

					<form.Field
						name="lastName"
						validators={{
							onChange: ({ value }) =>
								schema.shape.lastName.safeParse(value).success
									? undefined
									: "Last name is required",
						}}
					>
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
										value={field.state.value}
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
									with players of a similar level. It can be edited at any time
									from the settings page.
								</FormDescription>
								{field.state.meta.errors && (
									<p className="text-sm text-red-500">
										{field.state.meta.errors.join(", ")}
									</p>
								)}
							</FormItem>
						)}
					</form.Field>

					<form.Field
						name="tableTennisEnglandId"
						validators={{
							onChange: ({ value }) =>
								schema.shape.tableTennisEnglandId.safeParse(value).success
									? undefined
									: "Must be a 6-digit number",
						}}
					>
						{(field) => (
							<FormItem>
								<FormLabel>Table Tennis England ID</FormLabel>
								<FormControl>
									<Input
										placeholder="TT ID: XXXXXX"
										defaultValue={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => {
											field.handleChange(e.target.value);
											updateUrlWithFormState(
												"tableTennisEnglandId",
												e.target.value,
											);
										}}
										autoComplete="off"
										required
									/>
								</FormControl>
								{field.state.meta.errors ? (
									<p className="text-sm text-red-500">
										{field.state.meta.errors.join(", ")}
									</p>
								) : (
									<FormDescription>
										This is used to verify your Table Tennis England membership
										and is required before you can enter a league. It can be
										found in your members card or the email you received when
										signing up for or renewing your Table Tennis England
										membership.
									</FormDescription>
								)}
							</FormItem>
						)}
					</form.Field>

					<form.Field name="profilePicture">
						{() => (
							<FormItem>
								<FormLabel>Profile Picture (Optional)</FormLabel>
								<FormControl>
									<div className="flex items-center space-x-4">
										<Avatar>
											<AvatarImage src={profileImage || undefined} />
											<AvatarFallback />
										</Avatar>
										<div className="flex-1">
											<div className="hidden sm:block">
												<div
													{...getRootProps()}
													className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-gray-300 transition-colors"
												>
													<input {...getInputProps()} />
													<FileIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
													{isDragActive ? (
														<p className="text-sm text-gray-600">
															Drop the file here
														</p>
													) : (
														<>
															<p className="text-sm font-medium text-gray-600">
																Drag and drop an image or click to browse
															</p>
															<p className="text-xs text-gray-500 mt-1">
																Supported formats: JPG, PNG, GIF
															</p>
														</>
													)}
												</div>
											</div>
											<div className="sm:hidden">
												<input
													type="file"
													accept="image/*"
													ref={fileInputRef}
													className="hidden"
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) handleFileSelection(file);
													}}
												/>
												<Button
													type="button"
													variant="outline"
													className="w-full"
													onClick={() => fileInputRef.current?.click()}
												>
													<UploadIcon className="w-4 h-4 mr-2" />
													Upload Image
												</Button>
											</div>
										</div>
									</div>
								</FormControl>
							</FormItem>
						)}
					</form.Field>

					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit}>
								{isSubmitting ? "Submitting..." : "Submit"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
			<Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
				<DialogContent className="w-4/5 max-w-[450px]">
					<DialogHeader>
						<DialogTitle>Crop Profile Picture</DialogTitle>
					</DialogHeader>
					<div className="h-[300px] relative">
						{imageSrc && (
							<Cropper
								image={imageSrc}
								crop={crop}
								zoom={zoom}
								aspect={1}
								onCropChange={setCrop}
								onCropComplete={onCropComplete}
								onZoomChange={setZoom}
							/>
						)}
					</div>
					<div className="flex flex-col space-y-2">
						<label htmlFor="zoom-slider">Zoom</label>
						<Slider
							id="zoom-slider"
							min={1}
							max={3}
							step={0.1}
							value={[zoom]}
							onValueChange={(value) => setZoom(value[0])}
						/>
					</div>
					<Button onClick={showCroppedImage}>Crop and Save</Button>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
