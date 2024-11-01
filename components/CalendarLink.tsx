"use client";

import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";

type CalendarLinkProps = {
	name: string;
	description: string;
	startTime: Date;
	endTime: Date;
	venue: string;
};

function formatDateForIcs(date: Date) {
	return date
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(/\.\d{3}/, "");
}

export function CalendarLink({
	name,
	description,
	startTime,
	endTime,
	venue,
}: CalendarLinkProps) {
	const [calendarUrl, setCalendarUrl] = useState("");

	useEffect(() => {
		const icsData = [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"BEGIN:VEVENT",
			`DTSTART:${formatDateForIcs(startTime)}`,
			`DTEND:${formatDateForIcs(endTime)}`,
			`SUMMARY:${name}`,
			`DESCRIPTION:${description}`,
			`LOCATION:${venue}`,
			"END:VEVENT",
			"END:VCALENDAR",
		].join("\n");

		const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		setCalendarUrl(url);

		return () => {
			URL.revokeObjectURL(url);
		};
	}, [name, description, startTime, endTime, venue]);

	return (
		<a
			href={calendarUrl}
			download={`${name}.ics`}
			className="flex underline items-center gap-2 text-muted-foreground rounded-lg hover:bg-primary/10 transition-all duration-300"
		>
			<div className="text-primary">
				<CalendarIcon className="h-4 w-4" />
			</div>
			<span>{format(startTime, "EEE, MMM d, h:mma")} (Add to calendar)</span>
		</a>
	);
}
