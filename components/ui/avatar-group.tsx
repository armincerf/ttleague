import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export type AvatarUser = {
	id: string;
	first_name: string;
	last_name: string;
	profile_image_url?: string | null;
};

function PlayerSkeleton({ count }: { count: number }) {
	return (
		<>
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={`skeleton-${
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						i
					}`}
					className="-ml-3 first:ml-0"
				>
					<Skeleton className="w-10 h-10 rounded-full" />
				</div>
			))}
		</>
	);
}

export function AvatarGroup({
	users,
	loading,
	maxVisible = 5,
	onShowMore,
	renderAvatar,
}: {
	users: AvatarUser[];
	loading: boolean;
	maxVisible?: number;
	onShowMore: () => void;
	renderAvatar: (user: AvatarUser) => React.ReactNode;
}) {
	if (loading) {
		return <PlayerSkeleton count={maxVisible} />;
	}

	if (!users.length) {
		return <p>No players yet</p>;
	}

	return (
		<>
			{users.slice(0, maxVisible).map((user, index) => (
				<div
					key={user.id}
					className="relative"
					style={{
						width: "40px",
						height: "40px",
						marginLeft: index > 0 ? "-12px" : "0",
					}}
				>
					{renderAvatar(user)}
				</div>
			))}
			{users.length > maxVisible && (
				<Button
					variant="outline"
					size="icon"
					className="w-10 h-10 rounded-full -ml-3 shadow-none hover:bg-white hover:border-2 hover:border-black hover:border-opacity-15"
					onClick={onShowMore}
				>
					...
				</Button>
			)}
		</>
	);
}
