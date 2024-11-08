import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignInPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<div>sign in </div>
		</Suspense>
	);
}
