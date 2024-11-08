import { Suspense } from "react";
import { ManualMatchEntryForm } from "./ManualMatchEntryForm";

export default function ManualMatchEntryPage() {
	return (
		<div className="container max-w-4xl mx-auto py-8">
			<h1 className="text-2xl font-bold mb-6">Manual Match Entry</h1>
			<Suspense fallback={<div>Loading...</div>}>
				<ManualMatchEntryForm />
			</Suspense>
		</div>
	);
}
