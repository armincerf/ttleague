"use client";

import { useState, useEffect } from "react";
import { client } from "@/lib/triplit";
import { useQueryOne } from "@triplit/react";
import type { Event } from "@/lib/actions/events";

export default function CountdownTimer({
	seconds: initialSeconds,
	event,
}: { seconds: number; event: NonNullable<Event> }) {
	const { result } = useQueryOne(
		client,
		client
			.query("events")
			.where("id", "=", event.id)
			.select(["status", "start_time"]),
	);
	const [seconds, setSeconds] = useState(initialSeconds);
	const eventStatus = result?.status || event.status;

	useEffect(() => {
		if (event.start_time !== result?.start_time && result?.start_time) {
			setSeconds(
				Math.floor(
					(result?.start_time?.getTime() - new Date().getTime()) / 1000,
				),
			);
		}
	}, [result, event.start_time]);

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
		if (seconds < 0 && eventStatus === "scheduled") {
			client.update("events", event.id, (event) => {
				event.status = "active";
			});
		}
	}, [seconds, eventStatus, event.id]);

	return <CountdownTimerDisplay seconds={seconds} />;
}

export function CountdownTimerDisplay({ seconds }: { seconds: number }) {
	const days = Math.floor(seconds / (3600 * 24));
	const hours = Math.floor((seconds % (3600 * 24)) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	if (seconds === 0) {
		return <div className="text-2xl font-bold">--d --h --m --s</div>;
	}

	return (
		<div className="text-2xl font-bold">
			{days}d {hours}h {minutes}m {remainingSeconds}s
		</div>
	);
}
