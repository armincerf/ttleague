import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type HelpModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Help & Information</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					<section>
						<h3 className="font-semibold mb-2">What We Do</h3>
						<ul className="list-disc pl-4 space-y-2 text-sm">
							<li>Run a flexible singles table tennis league</li>
							<li>Match players of similar skill levels</li>
							<li>Track rankings and performance over time</li>
							<li>Play competitive matches on your own schedule</li>
							<li>
								Reduce the faff involved in organizing matches and filling out
								scorecards
							</li>
						</ul>
					</section>

					<section>
						<h3 className="font-semibold mb-2">Support</h3>
						<p className="text-sm text-muted-foreground">
							For any questions or assistance, please find Alex in person and
							he'll be happy to help!
						</p>
					</section>
				</div>
			</DialogContent>
		</Dialog>
	);
}
