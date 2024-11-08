import ActiveEventNoSSR from "./ActiveEventNoSSR";

export const runtime = "edge";
export default async function ActiveEventWrapper({
	params,
}: {
	params: Promise<{ eventId: string }>;
}) {
	const { eventId } = await params;
	return <ActiveEventNoSSR eventId={eventId} />;
}
