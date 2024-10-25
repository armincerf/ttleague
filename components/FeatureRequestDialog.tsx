"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import posthog from "posthog-js";
import { useState } from "react";

interface FeatureRequestDialogProps {
	isOpen: boolean;
	onClose: () => void;
	featureName: string;
}

export function FeatureRequestDialog({
	isOpen,
	onClose,
	featureName,
}: FeatureRequestDialogProps) {
	const [feedback, setFeedback] = useState("");

	async function handleSubmit() {
		posthog.capture("feature-important", {
			feature_name: featureName,
			feedback,
		});
		setFeedback("");
		onClose();
	}

	return (
		<Dialog open={isOpen} modal>
			<DialogContent hideClose preventClose>
				<DialogHeader>
					<DialogTitle>Feature Not Available Yet</DialogTitle>
					<DialogDescription>
						Sorry, {featureName} hasn't been completed yet. Please click the
						button below to let us know it's important to you!
					</DialogDescription>
				</DialogHeader>
				<Textarea
					placeholder="Optional: Let us know any specific requirements or feedback you have"
					value={feedback}
					onChange={(e) => setFeedback(e.target.value)}
				/>
				<DialogFooter className="flex justify-end gap-2">
					<Button variant="outline" onClick={onClose}>
						👎 Not important
					</Button>
					<Button onClick={handleSubmit}>👍 I want this!</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
