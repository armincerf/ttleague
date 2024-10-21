"use client";

import { useState, useEffect } from "react";

export default function CountdownTimer({
	seconds: initialSeconds,
}: { seconds: number }) {
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
