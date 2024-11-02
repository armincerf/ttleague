"use client";

import { useState, useEffect } from "react";
import type { Event } from "@/lib/actions/events";

export default function CountdownTimer({
	seconds: initialSeconds,
	eventId,
	eventStatus,
	eventStartTime,
}: {
	seconds: number;
	eventId: string;
	eventStatus: NonNullable<Event>["status"];
	eventStartTime: Date;
}) {
	const [seconds, setSeconds] = useState(initialSeconds);

	useEffect(() => {
		setSeconds(
			Math.floor((eventStartTime.getTime() - new Date().getTime()) / 1000),
		);
	}, [eventStartTime]);

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
