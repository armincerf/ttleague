// app/providers.tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PHProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	useEffect(() => {
		if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
			posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
				api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
				person_profiles: "always",
				capture_pageview: false, // Disable automatic pageview capture, as we capture manually
				capture_pageleave: true, // Enable pageleave capture
			});
		}
	}, []);

	return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
