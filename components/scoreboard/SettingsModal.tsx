import { type Updater, useForm } from "@tanstack/react-form";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	FormControl,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { ScoreboardContext, Player } from "@/lib/scoreboard/machine";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import { splitName, formatPlayerName } from "@/lib/scoreboard/utils";
import { ScoreboardMachineContext } from "@/lib/contexts/ScoreboardContext";
import { getStoredSettings, saveSettings } from "@/lib/scoreboard/storage";

type SettingsFormValues = Pick<
	ScoreboardContext,
	"bestOf" | "pointsToWin" | "playerOneStarts" | "sidesSwapped"
>;

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	settings: SettingsFormValues;
	onUpdate?: (settings: Partial<SettingsFormValues>) => void;
	players?: {
		player1: Player;
		player2: Player;
	};
	onPlayersSubmit?: (player1: Player, player2: Player) => void;
}

export function SettingsModal({
	isOpen,
	onClose,
	settings,
	onUpdate,
}: SettingsModalProps) {
	const send = ScoreboardMachineContext.useActorRef().send;
	const context = ScoreboardMachineContext.useSelector(
		(state) => state.context,
	);

	console.log("Current context:", context);
	console.log("Initial settings:", settings);
	console.log("Stored settings:", getStoredSettings());

	const form = useForm({
		defaultValues: {
			...settings,
			playerOneStarts: settings.playerOneStarts,
			player1Name: formatPlayerName(context.playerOne),
			player2Name: formatPlayerName(context.playerTwo),
		},
		onSubmit: async ({ value }) => {
			saveSettings(value);
			send({
				type: "SETTINGS_UPDATE",
				settings: {
					playerOneStarts: value.playerOneStarts,
					sidesSwapped: value.sidesSwapped,
					bestOf: value.bestOf,
					pointsToWin: value.pointsToWin,
				},
			});
			const currentPlayer1Name = formatPlayerName(context.playerOne);
			const currentPlayer2Name = formatPlayerName(context.playerTwo);

			const player1NameChanged = value.player1Name !== currentPlayer1Name;
			const player2NameChanged = value.player2Name !== currentPlayer2Name;

			if (player1NameChanged || player2NameChanged) {
				const player1Split = splitName(value.player1Name);
				const player2Split = splitName(value.player2Name);

				if (player1NameChanged) {
					send({
						type: "UPDATE_PLAYER_NAME",
						isPlayerOne: true,
						firstName: player1Split.firstName,
						lastName: player1Split.lastName,
					});
				}

				if (player2NameChanged) {
					send({
						type: "UPDATE_PLAYER_NAME",
						isPlayerOne: false,
						firstName: player2Split.firstName,
						lastName: player2Split.lastName,
					});
				}
			}

			onUpdate?.({
				bestOf: value.bestOf,
				pointsToWin: value.pointsToWin,
				playerOneStarts: value.playerOneStarts,
				sidesSwapped: value.sidesSwapped,
			});

			onClose();
		},
	});

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Game Settings</DialogTitle>
					<DialogDescription>
						These settings will be used for all future matches.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field
						name="bestOf"
						validators={{
							onChange: ({ value }) =>
								![3, 5, 7].includes(value) ? "Must be 3, 5, or 7" : undefined,
						}}
					>
						{(field) => (
							<FormItem className="space-y-3">
								<FormLabel>Best of</FormLabel>
								<FormControl>
									<RadioGroup
										value={field.state.value.toString()}
										onValueChange={(value) => field.handleChange(Number(value))}
										className="flex gap-4"
									>
										{[3, 5, 7].map((num) => (
											<FormItem
												key={num}
												className="flex items-center space-x-2"
											>
												<FormControl>
													<RadioGroupItem value={num.toString()} />
												</FormControl>
												<FormLabel className="font-normal">{num}</FormLabel>
											</FormItem>
										))}
									</RadioGroup>
								</FormControl>
								{field.state.meta.errors && (
									<FormMessage>
										{field.state.meta.errors.join(", ")}
									</FormMessage>
								)}
							</FormItem>
						)}
					</form.Field>

					<form.Field
						name="pointsToWin"
						validators={{
							onChange: ({ value }) =>
								![11, 21].includes(value) ? "Must be 11 or 21" : undefined,
						}}
					>
						{(field) => (
							<FormItem className="space-y-3">
								<FormLabel>Points to Win</FormLabel>
								<FormControl>
									<RadioGroup
										value={field.state.value.toString()}
										onValueChange={(value) => field.handleChange(Number(value))}
										className="flex gap-4"
									>
										{[11, 21].map((num) => (
											<FormItem
												key={num}
												className="flex items-center space-x-2"
											>
												<FormControl>
													<RadioGroupItem value={num.toString()} />
												</FormControl>
												<FormLabel className="font-normal">{num}</FormLabel>
											</FormItem>
										))}
									</RadioGroup>
								</FormControl>
								{field.state.meta.errors && (
									<FormMessage>
										{field.state.meta.errors.join(", ")}
									</FormMessage>
								)}
							</FormItem>
						)}
					</form.Field>

					<form.Field name="playerOneStarts">
						{(field) => (
							<FormItem className="flex items-center space-x-2">
								<FormControl>
									<Checkbox
										checked={field.state.value}
										onCheckedChange={(checked) => field.handleChange(!!checked)}
									/>
								</FormControl>
								<FormLabel className="text-sm font-medium">
									Player 1 Starts
								</FormLabel>
							</FormItem>
						)}
					</form.Field>

					<form.Field name="sidesSwapped">
						{(field) => (
							<FormItem className="flex items-center space-x-2">
								<FormControl>
									<Checkbox
										checked={field.state.value}
										onCheckedChange={(checked) =>
											field.handleChange(checked as Updater<boolean>)
										}
									/>
								</FormControl>
								<FormLabel className="text-sm font-medium">
									Swap Sides
								</FormLabel>
							</FormItem>
						)}
					</form.Field>

					<form.Field name="player1Name">
						{(field) => (
							<FormItem>
								<FormLabel>Player 1 Name</FormLabel>
								<FormControl>
									<Input
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="First Last"
										required
										onFocus={(e) => e.target.select()}
									/>
								</FormControl>
							</FormItem>
						)}
					</form.Field>

					<form.Field name="player2Name">
						{(field) => (
							<FormItem>
								<FormLabel>Player 2 Name</FormLabel>
								<FormControl>
									<Input
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="First Last"
										required
										onFocus={(e) => e.target.select()}
									/>
								</FormControl>
							</FormItem>
						)}
					</form.Field>

					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit}>
								{isSubmitting ? "..." : "Save Changes"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</DialogContent>
		</Dialog>
	);
}
