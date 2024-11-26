import { z } from "zod";
import { leagueDivisionsSchema } from "@/lib/ratingSystem";

export const onboardingSchema = z.object({
	email: z.string().email(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	currentLeagueDivision: leagueDivisionsSchema,
	tableTennisEnglandId: z.string().optional(),
	profilePicture: z.instanceof(File).optional(),
	gender: z.enum(["male", "female"]).optional(),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
