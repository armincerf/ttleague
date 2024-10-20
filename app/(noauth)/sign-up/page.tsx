import Logo from "@/components/Logo";
import SignInButton from "@/components/SignInButton";

export default function Home() {
	return (
		<main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
			<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
				<Logo className="mx-auto mb-8" />
				<p className="text-gray-600 text-center mb-8">
					Play in the Milton Keynes table tennis singles league held on Tuesday
					nights at Kingston. Get matched with other players automatically or
					choose your opponents yourself. See leaderboards and results and earn
					the chance to win the coveted top 8 trophy!
				</p>
				<SignInButton />
			</div>
		</main>
	);
}
