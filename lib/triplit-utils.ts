import { client } from "@/lib/triplit";
import logger from "@/lib/logging";

function handleSyncFailure(
	txId: string,
	errorMessage: string,
	context: Record<string, unknown>,
	reject: (reason: Error) => void,
) {
	return (error: unknown) => {
		logger.error(errorMessage, {
			error,
			...context,
		});
		client.syncEngine.rollback(txId);
		reject(
			new Error(
				`${errorMessage}. ${
					// @ts-expect-error - error is not typed
					error?.name ?? "Unknown error"
				}`,
			),
		);
	};
}

export { handleSyncFailure };
