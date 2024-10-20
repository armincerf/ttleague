import { z } from "zod";

export const leagueDivisionsSchema = z.enum([
	"MKTTL - Premier",
	"MKTTL - Division 1",
	"MKTTL - Division 2",
	"MKTTL - Division 3",
	"MKTTL - Division 4",
	"MKTTL - Division 5",
	"MKTTL - Division 6",
	"MKTTL - Division 7",
	"Not in a league",
]);

export type LeagueDivision = z.infer<typeof leagueDivisionsSchema>;

const baseRating = 1000;

export function initialRating(division?: LeagueDivision) {
	if (!division) {
		return baseRating;
	}
	const index = leagueDivisionsSchema.options.indexOf(division);
	return baseRating - index * 100;
}

export function getDivision(input?: string): LeagueDivision {
	const parsedDivision = leagueDivisionsSchema.safeParse(input);
	if (!parsedDivision.success) {
		return "Not in a league";
	}
	return parsedDivision.data;
}
