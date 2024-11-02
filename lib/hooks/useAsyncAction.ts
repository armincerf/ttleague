import { useState } from "react";

interface UseAsyncActionOptions {
	onError?: (error: unknown) => void;
	onSuccess?: () => void;
	actionName: string;
}

export function useAsyncAction(options: UseAsyncActionOptions) {
	const [isLoading, setIsLoading] = useState(false);

	const executeAction = async (action: () => Promise<void>) => {
		console.log("Executing action:", options.actionName);
		setIsLoading(true);
		try {
			await action();
			options.onSuccess?.();
		} catch (error) {
			console.error(`Error in ${options.actionName}:`, error);
			options.onError?.(error);
		} finally {
			setIsLoading(false);
		}
	};

	return {
		isLoading,
		executeAction,
	};
}
