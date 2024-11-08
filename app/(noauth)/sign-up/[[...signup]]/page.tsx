import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignUpPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<SignUp
				forceRedirectUrl={
					process.env.NODE_ENV === "development"
						? "http://localhost:3000/onboarding"
						: "https://www.ttrankings.com/onboarding"
				}
			/>
		</Suspense>
	);
}
