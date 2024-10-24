import { createContext, type Dispatch, type SetStateAction } from "react";

type TooltipTriggerContextType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
};

export const TooltipTriggerContext = createContext<TooltipTriggerContextType>({
	open: false,
	setOpen: () => undefined,
});
