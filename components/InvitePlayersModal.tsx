"use client";

import { useForm } from "@tanstack/react-form";
import type { FieldApi } from "@tanstack/react-form";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { sendInvites } from "@/app/actions/invites";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@triplit/react";
import { client } from "@/lib/triplit";
import { usePostHog } from "posthog-js/react";

interface InvitePlayersModalProps {
	isOpen: boolean;
	onClose: () => void;
	onComplete: () => void;
	userId: string;
}

export function InvitePlayersModal({
	isOpen,
	onClose,
	onComplete,
	userId,
}: InvitePlayersModalProps) {
	const { results: existingEmails } = useQuery(
		client,
		client.query("users").select(["email"]),
	);
	const posthog = usePostHog();
	const form = useForm({
		defaultValues: {
			emails: [""],
		},
		onSubmit: async ({ value }) => {
			posthog?.capture("invite_players_modal_submitted", {
				distinctId: userId,
				formValues: value,
			});
			const validEmails = value.emails.filter(
				(email) =>
					email.trim().length > 0 &&
					!existingEmails?.some((user) => user.email === email),
			);
			const uniqueEmails = [...new Set(validEmails)];

			if (uniqueEmails.length > 0) {
				const redirectUrl = `${window.location.origin}/sign-up`;
				const result = await sendInvites(uniqueEmails, redirectUrl);
				if (!result.success) {
					toast({
						title: "Error sending invites",
						description: result.error,
						variant: "destructive",
					});
					return;
				}
			}
			onComplete();
		},
	});

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>One last step</DialogTitle>
					<DialogDescription>
						Know any good players that might be interested in this event? Enter
						their emails below to invite them, or share this event by clicking{" "}
						<button
							type="button"
							className="text-primary underline"
							onClick={() => {
								if (navigator.share) {
									navigator
										.share({
											title: "Join this event",
											url: `${window.location.origin}/sign-up?utm_source=onboarding&utm_medium=invite`,
										})
										.catch(() => {
											// Ignore errors from user canceling
										});
								}
							}}
						>
							here
						</button>
						.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.Field name="emails" mode="array">
						{(field) => (
							<div>
								<div className="space-y-3">
									{field.state.value.map((_, index) => {
										const isExistingEmail = existingEmails?.some(
											(user) => user.email === field.state.value[index],
										);
										return (
											// biome-ignore lint/suspicious/noArrayIndexKey: needed for field array logic
											<form.Field key={index} name={`emails[${index}]`}>
												{(emailField) => (
													<div>
														{!isExistingEmail && (
															<div className="flex gap-2">
																<Input
																	type="email"
																	placeholder="player@example.com"
																	value={emailField.state.value ?? ""}
																	onChange={(e) =>
																		emailField.handleChange(e.target.value)
																	}
																	onBlur={emailField.handleBlur}
																	autoComplete="off"
																/>
																{index > 0 && (
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon"
																		onClick={() => {
																			const newEmails = [...field.state.value];
																			newEmails.splice(index, 1);
																			field.setValue(newEmails);
																		}}
																	>
																		<X className="h-4 w-4" />
																	</Button>
																)}
															</div>
														)}
														{isExistingEmail && (
															<p className="pl-2 text-sm text-gray-500">
																{field.state.value[index]} is already signed up!
															</p>
														)}
													</div>
												)}
											</form.Field>
										);
									})}
								</div>

								<div className="flex flex-col gap-2 mt-4">
									<Button
										type="button"
										variant="outline"
										onClick={() => field.pushValue("")}
									>
										Add another email
									</Button>

									<form.Subscribe
										selector={(state) => [state.isSubmitting, state.values]}
									>
										{([isSubmitting, values]) => {
											const hasEmails =
												typeof values !== "boolean" &&
												values.emails.some((email) => email.trim().length > 0);
											return (
												<Button
													type="submit"
													className={cn(
														hasEmails
															? "bg-tt-blue hover:bg-tt-blue/90 text-white px-8"
															: "bg-primary hover:bg-primary/90 text-white px-8",
														isSubmitting && "opacity-50 cursor-not-allowed",
													)}
													disabled={!!isSubmitting}
												>
													{hasEmails
														? "Submit and continue"
														: "I don't know anyone, just continue"}
												</Button>
											);
										}}
									</form.Subscribe>
								</div>
							</div>
						)}
					</form.Field>
				</form>
			</DialogContent>
		</Dialog>
	);
}
