import { Suspense } from "react";
import { UserMigrationNoSSR } from "./UserMigrationNoSSR";
export default function UserMigrationPage() {
	return (
		<div>
			<h1>User Migration</h1>
			<Suspense fallback={<div>Loading...</div>}>
				<UserMigrationNoSSR />
			</Suspense>
		</div>
	);
}
