import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CorrectionButtonProps {
	correctionsMode: boolean;
	onToggle: () => void;
	onReset: () => void;
	onResetMatch: () => void;
}

function useConfirmation() {
	const [isOpen, setIsOpen] = useState(false);
	const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
	const [confirmationMessage, setConfirmationMessage] = useState("");

	function confirm(message: string, action: () => void) {
		setConfirmationMessage(message);
		setPendingAction(() => action);
		setIsOpen(true);
	}

	function handleConfirm() {
		pendingAction?.();
		setIsOpen(false);
	}

	return {
		isOpen,
		confirmationMessage,
		confirm,
		handleConfirm,
		handleCancel: () => setIsOpen(false),
	};
}

export function CorrectionButton({
	correctionsMode,
	onToggle,
	onReset,
	onResetMatch,
}: CorrectionButtonProps) {
	const confirmation = useConfirmation();

	return (
		<>
			<Dialog
				open={confirmation.isOpen}
				onOpenChange={confirmation.handleCancel}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Reset</DialogTitle>
						<DialogDescription>
							{confirmation.confirmationMessage}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={confirmation.handleCancel}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmation.handleConfirm}>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{correctionsMode ? (
				<div className="flex flex-col gap-2">
					<button
						type="button"
						onClick={onToggle}
						className="bg-green-200 border border-slate-200 text-slate-900 px-4 py-3 text-lg rounded-none hover:bg-red-600 uppercase"
					>
						resume game
					</button>
					<button
						type="button"
						onClick={() =>
							confirmation.confirm(
								"Are you sure you want to reset the current game?",
								onReset,
							)
						}
						className="bg-red-500 text-white px-4 py-3 text-lg rounded-none hover:bg-red-600 uppercase"
					>
						reset game
					</button>
					<button
						type="button"
						onClick={() =>
							confirmation.confirm(
								"You are about to reset the entire match. Are you sure?",
								onResetMatch,
							)
						}
						className="bg-red-500 text-white px-4 py-3 text-lg rounded-none hover:bg-red-500 uppercase"
					>
						reset match
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={onToggle}
					className="bg-black text-white px-4 py-3 text-lg rounded-none hover:bg-red-500 uppercase"
				>
					correction
				</button>
			)}
		</>
	);
}

type CorrectionActionsProps = {
	onAdd: () => void;
	onSubtract: () => void;
};

export function CorrectionActions({
	onAdd,
	onSubtract,
}: CorrectionActionsProps) {
	return (
		<div className="flex flex-col gap-2">
			<button
				onClick={onAdd}
				className="w-full bg-red-500 py-1 uppercase text-2xl text-white z-50"
				type="button"
			>
				add point
			</button>
			<button
				onClick={onSubtract}
				className="w-full bg-red-500 py-1 uppercase text-2xl text-white z-50"
				type="button"
			>
				subtract point
			</button>
		</div>
	);
}
