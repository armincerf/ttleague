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
import InProgressSection from "./InProgressSection";
import { AdminButton } from "@/components/AdminButton";
import { AdminLeagueActions } from "./AdminLeagueActions";
import LeagueSeasonsOrEvents from "./LeagueSeasons";
import Link from "next/link";

function LeagueHeader({
	league,
}: { league: NonNullable<Awaited<ReturnType<typeof fetchLeague>>> }) {
	return (
		<>
			<div className="relative h-[40vh] w-full mb-8">
				<div className="absolute inset-0">
					<Image
						src={league.logo_image_url}
						alt={`${league.name} logo`}
						fill
						className="object-cover fixed-image"
						priority
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
				</div>
				<div className="relative h-full max-w-4xl mx-auto flex items-center px-4">
					<h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-lg">
						{league.name}
					</h1>
				</div>
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
