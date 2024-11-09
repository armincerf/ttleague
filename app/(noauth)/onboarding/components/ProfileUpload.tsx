import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FormLabel, FormControl } from "@/components/ui/form";
import { ImageCropper } from "@/components/form/ImageCropper";
import { useUser } from "@/lib/hooks/useUser";
import { client } from "@/lib/triplit";
import { usePostHog } from "posthog-js/react";

export function ProfileImageUpload() {
	const { user } = useUser();
	const [isCropperOpen, setIsCropperOpen] = useState(false);
	const posthog = usePostHog();
	if (!user) return <p>User not found</p>;
	return (
		<div>
			<FormLabel>Profile Picture (Optional)</FormLabel>
			<FormControl>
				<div className="flex items-center space-x-4">
					<Avatar>
						<AvatarImage src={user?.imageUrl || undefined} />
						<AvatarFallback />
					</Avatar>
					<ImageCropper
						isOpen={isCropperOpen}
						onOpenChange={setIsCropperOpen}
						onSave={async (file) => {
							const p = await user?.setProfileImage({ file });
							await client.update("users", user.id, (u) => {
								u.profile_image_url = p.publicUrl ?? undefined;
							});
							console.log("profile image uploaded");
							posthog.capture("profile_image_uploaded");
						}}
					/>
				</div>
			</FormControl>
		</div>
	);
}
