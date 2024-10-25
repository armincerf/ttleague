export default function PrivacyPolicyPage() {
	return (
		<div className="flex flex-col items-center justify-center max-w-3xl mx-auto p-6 space-y-6">
			<h1 className="text-4xl font-bold">Privacy Policy</h1>
			<p className="text-lg">Last updated: 25/10/2024</p>
			<p className="text-lg">Effective Date: 25/10/2024</p>

			<section className="space-y-4 w-full">
				<h2 className="text-2xl font-semibold">1. Information We Collect</h2>
				<p>
					We only collect information that you directly provide to us, which may
					include:
				</p>
				<ul className="list-disc pl-6 space-y-2">
					<li>Your name and email address</li>
					<li>Account credentials</li>
					<li>Any additional information you choose to provide</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-6">
					2. How We Use Your Information
				</h2>
				<p>We use your information solely for:</p>
				<ul className="list-disc pl-6 space-y-2">
					<li>Providing and maintaining your account</li>
					<li>Responding to your requests or inquiries</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-6">3. Cookies and Tracking</h2>
				<p>
					We do not use tracking cookies or any third-party analytics tools. We
					only use essential cookies that are necessary for the basic
					functionality of our service.
				</p>

				<h2 className="text-2xl font-semibold mt-6">4. Data Security</h2>
				<p>
					We implement appropriate security measures to protect your personal
					information from unauthorized access, alteration, disclosure, or
					destruction.
				</p>

				<h2 className="text-2xl font-semibold mt-6">5. Your Rights</h2>
				<p>You have the right to:</p>
				<ul className="list-disc pl-6 space-y-2">
					<li>Access your personal information</li>
					<li>Correct inaccurate information</li>
					<li>Request deletion of your information</li>
					<li>Withdraw consent at any time</li>
				</ul>
			</section>
		</div>
	);
}
