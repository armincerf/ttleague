"use client";

import dynamic from "next/dynamic";

const ActiveEvent = dynamic(() => import("./ActiveEvent"), { ssr: false });

export default function ActiveEventNoSSR({ eventId }: { eventId: string }) {
	return <ActiveEvent eventId={eventId} />;
}
