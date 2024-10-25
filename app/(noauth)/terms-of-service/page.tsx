import type { FC } from "react";

const TermsOfServicePage: FC = () => {
	return (
		<div className="max-w-3xl mx-auto py-12 px-4">
			<h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
				<p className="mb-4">
					By accessing and using this service, you acknowledge that you have
					read, understood, and agree to be bound by these Terms of Service.
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-4">2. Age Requirement</h2>
				<p className="mb-4">
					You must be 13 years of age or older to use this service. By using
					this service, you represent and warrant that you are at least 13 years
					old. If you are under 13 years old, you may not use this service under
					any circumstances.
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-4">3. User Conduct</h2>
				<p className="mb-4">
					Users agree to communicate respectfully with others and not to:
				</p>
				<ul className="list-disc pl-8 mb-4">
					<li>Harass, abuse, or harm other users</li>
					<li>Share inappropriate, illegal, or harmful content</li>
					<li>Impersonate others or create false identities</li>
					<li>Spam or distribute unauthorized advertisements</li>
					<li>Violate any applicable laws or regulations</li>
				</ul>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-4">4. Privacy and Data</h2>
				<p className="mb-4">
					We collect and process user data as described in our Privacy Policy.
					By using this service, you consent to our data practices as described
					in the Privacy Policy.
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-4">5. Termination</h2>
				<p className="mb-4">
					We reserve the right to terminate or suspend your account and access
					to the service at our sole discretion, without notice, for conduct
					that we believe violates these Terms of Service or is harmful to other
					users, us, or third parties, or for any other reason.
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-4">6. Changes to Terms</h2>
				<p className="mb-4">
					We reserve the right to modify these terms at any time. We will notify
					users of any material changes to these terms. Your continued use of
					the service after such modifications constitutes your acceptance of
					the updated terms.
				</p>
			</section>

			<footer className="text-sm text-gray-600">
				Last updated: 25-10-2024
			</footer>
		</div>
	);
};

export default TermsOfServicePage;
