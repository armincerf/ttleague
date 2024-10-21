"use client";

import { useState, useEffect } from "react";
import type { Event } from "@/triplit/schema";
import { client } from "@/lib/triplit";
export default function CountdownTimer({
	seconds: initialSeconds,
	event,
}: { seconds: number; event: Event }) {
	const [seconds, setSeconds] = useState(initialSeconds);

	useEffect(() => {
		const timer = setInterval(() => {
			setSeconds((prevSeconds) => {
				if (prevSeconds <= 1) {
					clearInterval(timer);
					return 0;
				}
				return prevSeconds - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		if (seconds < 0 && event?.status === "scheduled") {
			client.update("events", event.id, (event) => {
				event.status = "active";
			});
		}
	}, [seconds, event?.id, event?.status]);

	const days = Math.floor(seconds / (3600 * 24));
	const hours = Math.floor((seconds % (3600 * 24)) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	return (
		<div className="text-2xl font-bold">
			{days}d {hours}h {minutes}m {remainingSeconds}s
		</div>
	);
}
