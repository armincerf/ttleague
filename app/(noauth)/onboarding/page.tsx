import { redirect } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { OnboardingFormSkeleton } from "./components/OnboardingFormSkeleton";
import dynamic from "next/dynamic";
import TopBar from "@/components/TopBar";
import { Suspense } from "react";

const OnboardingForm = dynamic(() => import("./components/OnboardingForm"), {
	loading: () => <OnboardingFormSkeleton />,
});

async function OnboardingPage() {
	const user = await currentUser();

	if (!user) {
		return null;
	}

	return (
		<div className="flex flex-col h-[calc(100%-64px)] pb-10 w-full overflow-y-auto">
			<OnboardingForm />
		</div>
	);
}

export const runtime = "edge";
export default async function OnboardingPageWrapper() {
	return (
		<Suspense fallback={<div>Loading onboarding...</div>}>
			<ClerkProvider dynamic>
				<TopBar />
				<OnboardingPage />
			</ClerkProvider>
		</Suspense>
	);
}
