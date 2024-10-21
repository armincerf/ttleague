"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

function FAQDialogButton({ faqHtml }: { faqHtml: string }) {
	const [isOpen, setIsOpen] = useState(false);

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
					{/* biome-ignore lint/security/noDangerouslySetInnerHtml: meh */}
					<div dangerouslySetInnerHTML={{ __html: faqHtml }} />
				</DialogContent>
			</Dialog>
		</>
	);
}

export default FAQDialogButton;
