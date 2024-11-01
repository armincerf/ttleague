import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function WIPAlertBanner() {
	return (
		<Alert variant="warning" className="max-w-2xl mb-2 -mt-4">
			<AlertTriangle className="h-4 w-4" />
			<AlertTitle>Work in Progress</AlertTitle>
			<AlertDescription>
				This page is currently under development and may contain bugs or
				incomplete features. Some functionality might not work as expected.
			</AlertDescription>
		</Alert>
	);
}
