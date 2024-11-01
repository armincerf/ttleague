type CalendarEvent = {
	title: string;
	description: string;
	startTime: Date;
	endTime: Date;
	location: string;
};

function formatDateForIcs(date: Date) {
	return date
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(/\.\d{3}/, "");
}

function addToCalendarLink(event: CalendarEvent) {
	const icsData = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"BEGIN:VEVENT",
		`DTSTART:${formatDateForIcs(event.startTime)}`,
		`DTEND:${formatDateForIcs(event.endTime)}`,
		`SUMMARY:${event.title}`,
		`DESCRIPTION:${event.description}`,
		`LOCATION:${event.location}`,
		"END:VEVENT",
		"END:VCALENDAR",
	].join("\n");

	const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
	return URL.createObjectURL(blob);
}

export { addToCalendarLink, type CalendarEvent };
