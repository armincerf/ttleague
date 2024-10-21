import { useEffect, useState } from "react";

export function useLoadingState(fetching: boolean, data: unknown, delay = 500) {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!fetching && data !== undefined) {
			const timer = setTimeout(() => {
				setIsLoading(false);
			}, delay);

			return () => clearTimeout(timer);
		}
	}, [fetching, data, delay]);

	return isLoading;
}
