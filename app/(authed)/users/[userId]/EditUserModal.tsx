"use client";

import {
	Dialog,
	DialogHeader,
	DialogContent,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { User } from "@/triplit/schema";
import { useUser } from "@/lib/hooks/useUser";
import { ProfileImageUpload } from "@/app/(noauth)/onboarding/components/ProfileUpload";

interface EditUserModalProps {
	user: User;
}

export function EditUserModal({ user }: EditUserModalProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { user: currentUser } = useUser();

	return (
		<div className="sticky z-20 top-8 right-8 translate-x-8 -translate-y-8">
			{currentUser?.id === user.id && (
				<Button
					onClick={() => setIsOpen(true)}
					className="absolute top-4 right-4"
				>
					Edit Profile
				</Button>
			)}

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Edit Profile</DialogTitle>
						<DialogDescription>
							Make changes to your profile here
						</DialogDescription>
					</DialogHeader>

					<ProfileImageUpload />

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsOpen(false)}>
							Cancel
						</Button>
						<Button onClick={() => window.location.reload()} type="button">
							Save changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
