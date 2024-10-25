import { ClerkProvider } from "@clerk/nextjs";
import MatchView from "../MatchView";
import { fetchMatch } from "@/lib/actions/matches";
import { notFound } from "next/navigation";

export default async function MatchFormPage({
	params,
}: {
	params: Promise<{ matchId: string }>;
}) {
	const { matchId } = await params;
	const serverMatch = await fetchMatch(matchId);
	if (!serverMatch) return notFound();
	return (
		<ClerkProvider dynamic>
			<MatchView serverMatch={serverMatch} />
		</ClerkProvider>
	);
}
