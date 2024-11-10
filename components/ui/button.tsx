import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow hover:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
				outline:
					"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 rounded-md px-3 text-xs",
				lg: "h-10 rounded-md px-8",
				icon: "h-9 w-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		loading?: boolean;
		actionName?: string;
	};

type ReactTextNode = string | number;
type TextExtractable =
	| ReactTextNode
	| { props: { children?: React.ReactNode } };

function isTextNode(node: unknown): node is ReactTextNode {
	return typeof node === "string" || typeof node === "number";
}

function isReactElement(
	node: unknown,
): node is { props: { children?: React.ReactNode } } {
	return node !== null && typeof node === "object" && "props" in node;
}

function extractTextFromChildren(children: unknown): string {
	if (!children) return "";
	if (isTextNode(children)) return String(children);

	if (Array.isArray(children)) {
		return children
			.map((child) => extractTextFromChildren(child))
			.filter(Boolean)
			.join(" ");
	}

	if (isReactElement(children)) {
		return extractTextFromChildren(children.props.children);
	}

	return "";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			asChild = false,
			loading = false,
			actionName,
			children,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : "button";
		const extractedText = extractTextFromChildren(children);
		const finalActionName =
			actionName ??
			(extractedText
				? extractedText.toLowerCase().replace(/\s+/g, "_")
				: undefined);

		return (
			<Comp
				className={cn(
					buttonVariants({ variant, size, className }),
					loading && "opacity-50 cursor-wait",
				)}
				data-ph-capture="clicked"
				data-ph-action-name={finalActionName}
				disabled={loading || props.disabled}
				ref={ref}
				{...props}
			>
				{children}
			</Comp>
		);
	},
);

export { Button, buttonVariants };
