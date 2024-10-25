import { AdminButton } from "@/components/AdminButton";
import { AdminLeagueActions } from "./AdminLeagueActions";
import { ClerkProvider } from "@clerk/nextjs";

interface AdminLeagueButtonProps {
	leagueId: string;
}

export function AdminLeagueButton({ leagueId }: AdminLeagueButtonProps) {
	return (
		<AdminButton>
			<AdminLeagueActions leagueId={leagueId} />
		</AdminButton>
	);
}
