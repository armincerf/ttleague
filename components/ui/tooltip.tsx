"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { TooltipTriggerContext } from "@/lib/contexts/tooltip-trigger-context";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>
>(({ children, ...props }, ref) => {
	const [open, setOpen] = React.useState(false);

	return (
		<TooltipPrimitive.Root open={open} onOpenChange={setOpen} {...props}>
			<TooltipTriggerContext.Provider value={{ open, setOpen }}>
				{children}
			</TooltipTriggerContext.Provider>
		</TooltipPrimitive.Root>
	);
});
Tooltip.displayName = TooltipPrimitive.Root.displayName;

const TooltipTrigger = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ className, ...props }, ref) => {
	const { setOpen } = React.useContext(TooltipTriggerContext);

	return (
		<TooltipPrimitive.Trigger
			ref={ref}
			className={cn("focus:outline-none", className)}
			onClick={(e) => {
				if (window.matchMedia("(max-width: 768px)").matches) {
					e.preventDefault();
					setOpen(true);
				}
			}}
			{...props}
		/>
	);
});
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

const TooltipContent = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
	<TooltipPrimitive.Portal>
		<TooltipPrimitive.Content
			ref={ref}
			sideOffset={sideOffset}
			className={cn(
				"z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
				className,
			)}
			{...props}
		/>
	</TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
