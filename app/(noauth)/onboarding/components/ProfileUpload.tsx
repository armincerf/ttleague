import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FormLabel, FormControl } from "@/components/ui/form";
import { ImageCropper } from "@/components/form/ImageCropper";
import { useUser } from "@clerk/nextjs";

export function ProfileImageUpload() {
	const { user } = useUser();
	const [isCropperOpen, setIsCropperOpen] = useState(false);

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
						onSave={async (file) => void user?.setProfileImage({ file })}
					/>
				</div>
			</FormControl>
		</div>
	);
}
