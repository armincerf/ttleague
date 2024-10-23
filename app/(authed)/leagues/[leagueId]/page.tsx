import { Suspense } from "react";
import PageLayout from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import FAQDialogButton from "./FAQDialogButton";
import RegisteredPlayersList from "./RegisteredPlayersList";
import LeagueRegistrationButton from "./LeagueRegistrationButton";
import ClubLocationLink from "@/components/ClubLocationLink";
import { fetchLeague, fetchLeagues } from "@/lib/actions/leagues";
import logger from "@/lib/logging";
import LeagueSeasons from "./LeagueSeasons";
import InProgressSection from "./InProgressSection";

function LeagueHeader({
	league,
}: { league: NonNullable<Awaited<ReturnType<typeof fetchLeague>>> }) {
	return (
		<>
			<div className="flex items-center mb-6 h-16">
				<div className="w-44 h-16 mr-4 relative overflow-hidden">
					<Image
						src={league.logo_image_url}
						alt={`${league.name} logo`}
						fill
						className="object-cover"
					/>
				</div>
				<h1 className="text-3xl font-bold">{league.name}</h1>
			</div>

			<Card className="mb-8">
				<CardContent className="pt-6">
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
		</>
	);
}

function LeagueNotFound({ leagueId }: { leagueId: string }) {
	return <div>League not found: {leagueId}</div>;
}

// Next.js will invalidate the cache when a request comes in, at most once every 60 seconds.
export const revalidate = 60;

// We'll prerender only the params from `generateStaticParams` at build time.
// If a request comes in for a path that hasn't been generated,
// Next.js will server-render the page on-demand.
export const dynamicParams = true;

export async function generateStaticParams() {
	const leagues = await fetchLeagues();
	return leagues.map((league) => ({
		leagueId: league.id,
	}));
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

					<LeagueRegistrationButton leagueId={leagueId} />

					<Suspense fallback={<div>Loading registered players...</div>}>
						<RegisteredPlayersList
							leagueId={leagueId}
							leagueName={league.name}
						/>
					</Suspense>

					<Suspense fallback={<div>Loading in-progress section...</div>}>
						<InProgressSection leagueId={leagueId} />
					</Suspense>

					<Suspense fallback={<div>Loading seasons and events...</div>}>
						<LeagueSeasons leagueId={leagueId} />
					</Suspense>
				</div>
			</PageLayout>
		);
	} catch (error) {
		logger.error({ leagueId, error }, "Error rendering league page");
		throw error;
	}
}
