import { useUser as useClerkUser } from "@clerk/nextjs";
import { useEntity, useQuery } from "@triplit/react";
import { useSearchParams } from "next/navigation";
import { client } from "../triplit";
export function useUser() {
	const { user, isLoaded, isSignedIn } = useClerkUser();
	const override = useSearchParams().get("overrideUser");
	const overrideUser = useEntity(client, "users", override ?? "").result;
	if (!user)
		return {
			user: {
				...overrideUser,
				id: override ?? "",
				firstName: overrideUser?.first_name ?? "",
				lastName: overrideUser?.last_name ?? "",
			},
			isLoaded,
			isSignedIn,
		};
	return {
		...user,
		user: {
			...user,
			id: overrideUser?.id ?? user.id,
			firstName: overrideUser?.first_name ?? user.firstName,
			lastName: overrideUser?.last_name ?? user.lastName,
		},
		isLoaded,
		isSignedIn,
	} satisfies ReturnType<typeof useClerkUser>;
}
