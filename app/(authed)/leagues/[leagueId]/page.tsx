import { Suspense } from "react";
import PageLayout from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import FAQDialogButton from "./FAQDialogButton";
import ClubLocationLink from "@/components/ClubLocationLink";
import { fetchLeague } from "@/lib/actions/leagues";
import logger from "@/lib/logging";
import InProgressSection from "./InProgressSection";
import { AdminButton } from "@/components/AdminButton";
import { AdminLeagueActions } from "./AdminLeagueActions";
import LeagueSeasonsOrEvents from "./LeagueSeasons";
function LeagueHeader({
	league,
}: { league: NonNullable<Awaited<ReturnType<typeof fetchLeague>>> }) {
	return (
			<Card className="my-8">
				<CardContent className="pt-6">
					<h1 className="text-2xl font-bold mb-4">{league.name}</h1>
					<p className="mb-4">{league.description}</p>
					{league.clubs && league.clubs.length > 0 && (
						<div className="mb-4">
							<h3 className="text-sm font-semibold mb-2">
								{league.clubs.length === 1 ? "Location:" : "Locations:"}
							</h3>
							<ul>
								{league.clubs.map((club) => (
									<ClubLocationLink key={club.id} club={club} />
								))}
							</ul>
						</div>
					)}
					<FAQDialogButton faqHtml={league.faq_html} leagueId={league.id} />
				</CardContent>
			</Card>
	);
}

function LeagueNotFound({ leagueId }: { leagueId: string }) {
	return <div>League not found: {leagueId}</div>;
}

export default async function LeaguePage({
	params,
}: {
	params: Promise<{ leagueId: string }>;
}) {
	const { leagueId } = await params;

	try {
		const league = await fetchLeague(leagueId);

		if (!league) {
			return <LeagueNotFound leagueId={leagueId} />;
		}

		return (
			<PageLayout>
				<div className="max-w-4xl mx-auto pb-24">
					<LeagueHeader league={league} />

					<Suspense fallback={<div>Loading in-progress section...</div>}>
						<InProgressSection leagueId={leagueId} />
					</Suspense>

					<Suspense fallback={<div>Loading seasons and events...</div>}>
						<LeagueSeasonsOrEvents leagueId={leagueId} />
					</Suspense>

					<AdminButton>
						<AdminLeagueActions leagueId={leagueId} />
					</AdminButton>
				</div>
			</PageLayout>
		);
	} catch (error) {
		logger.error({ leagueId, error }, "Error rendering league page");
		throw error;
	}
}
