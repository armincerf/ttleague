import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
	return (
		<SignUp
			forceRedirectUrl={
				process.env.NODE_ENV === "development"
					? "http://localhost:3000/onboarding"
					: "https://www.ttrankings.com/onboarding"
			}
		/>
	);
}
