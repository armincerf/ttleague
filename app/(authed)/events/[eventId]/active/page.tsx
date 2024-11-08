import ActiveEventNoSSR from "./ActiveEventNoSSR";
import { unstable_cacheLife as cacheLife } from "next/cache";

export default async function ActiveEventWrapper({
	params,
}: {
	params: Promise<{ eventId: string }>;
}) {
	"use cache";
	cacheLife("seconds");

	const { eventId } = await params;
	return <ActiveEventNoSSR eventId={eventId} />;
}
