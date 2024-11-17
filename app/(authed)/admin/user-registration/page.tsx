import { Suspense } from "react";
import { UserRegistrationForm } from "./UserRegistrationForm";

export default function UserRegistrationPage() {
	return (
		<div className="container max-w-4xl mx-auto py-8">
			<h1 className="text-2xl font-bold mb-6">User Registration QR Code</h1>
			<Suspense fallback={<div>Loading...</div>}>
				<UserRegistrationForm />
			</Suspense>
		</div>
	);
} 