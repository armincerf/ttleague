import ActiveEvent from "./ActiveEvent";

export default async function ActiveEventWrapper({
	params,
}: {
	params: Promise<{ eventId: string }>;
}) {
	const { eventId } = await params;
	return <ActiveEvent eventId={eventId} />;
}
