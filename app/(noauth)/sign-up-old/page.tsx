import Logo from "@/components/Logo";
import SignInButton from "@/components/SignInButton";

export default function SignUpPage() {
	return (
		<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mx-auto">
			<Logo className="mx-auto mb-8" />
			<p className="text-gray-600 text-center mb-8">
				Play in the Milton Keynes table tennis singles league held on Tuesday
				nights at Kingston. Get matched with other players automatically or
				choose your opponents yourself. See leaderboards and results and earn
				the chance to win the coveted top 8 trophy!
			</p>
			<SignInButton />
		</div>
	);
}
