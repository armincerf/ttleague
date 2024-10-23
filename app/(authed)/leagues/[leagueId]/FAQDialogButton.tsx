"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useQueryOne } from "@triplit/react";
import { client } from "@/lib/triplit";

function FAQDialogButton({
	faqHtml,
	leagueId,
}: { faqHtml: string; leagueId: string }) {
	const [isOpen, setIsOpen] = useState(false);
	const { result } = useQueryOne(
		client,
		client
			.query("leagues")
			.where([["id", "=", leagueId]])
			.select(["faq_html"]),
	);

	return (
		<>
			<Button variant="outline" onClick={() => setIsOpen(true)}>
				View FAQ
			</Button>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
					<DialogHeader>
						<DialogTitle>Frequently Asked Questions</DialogTitle>
					</DialogHeader>
					<div
						className="prose max-w-full"
						// biome-ignore lint/security/noDangerouslySetInnerHtml:
						dangerouslySetInnerHTML={{
							__html: result?.faq_html ?? faqHtml,
						}}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}

export default FAQDialogButton;
