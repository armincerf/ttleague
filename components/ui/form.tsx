"use client";

import * as React from "react";
import type * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const FormItem = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	return <div ref={ref} className={cn("space-y-2", className)} {...props} />;
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
	React.ElementRef<typeof LabelPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
	return <Label ref={ref} className={cn(className)} {...props} />;
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
	React.ElementRef<typeof Slot>,
	React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
	return <Slot ref={ref} {...props} />;
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
	return (
		<div className="flex items-start gap-2">
			<p
				ref={ref}
				className={cn("text-sm p-0 text-muted-foreground", className)}
				{...props}
			/>
		</div>
	);
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
	return (
		<p
			ref={ref}
			className={cn("text-sm font-medium text-destructive", className)}
			{...props}
		>
			{children}
		</p>
	);
});
FormMessage.displayName = "FormMessage";

export { FormItem, FormLabel, FormControl, FormDescription, FormMessage };
