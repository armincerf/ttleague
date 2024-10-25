"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { User } from "@/components/LeaderboardTable";
import { useState } from "react";
import { FeatureRequestDialog } from "@/components/FeatureRequestDialog";
import posthog from "posthog-js";

interface UsersListProps {
	users: User[];
}

export default function UsersList({ users }: UsersListProps) {
	const [showFeatureDialog, setShowFeatureDialog] = useState(false);

	function handleChallenge() {
		setShowFeatureDialog(true);
	}

	return (
		<div className="grid gap-4">
			{users.map((user, index) => (
				<Card key={user.id} className="p-4">
					<div className="flex items-center gap-4">
						<div className="flex-shrink-0 w-12 text-center font-bold">
							#{index + 1}
						</div>
						<Avatar className="h-12 w-12">
							<AvatarImage
								src={user.profile_image_url}
								alt={`${user.first_name} ${user.last_name}`}
							/>
							<AvatarFallback>
								{user.first_name[0]}
								{user.last_name[0]}
							</AvatarFallback>
						</Avatar>
						<div className="flex-grow">
							<div className="font-semibold">
								{user.first_name} {user.last_name}
							</div>
							<div className="text-sm text-muted-foreground">
								Rating: {user.rating}
							</div>
						</div>
						<Button onClick={handleChallenge}>Challenge</Button>
					</div>
				</Card>
			))}

			<FeatureRequestDialog
				isOpen={showFeatureDialog}
				onClose={() => {
					posthog.capture("feature-not-important", {
						feature_name: "Challenge Player",
					});
					return setShowFeatureDialog(false);
				}}
				featureName="Challenge Player"
			/>
		</div>
	);
}
