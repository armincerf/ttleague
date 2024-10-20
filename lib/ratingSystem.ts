export const leagueDivisions = [
	"MKTTL - Premier",
	"MKTTL - Division 1",
	"MKTTL - Division 2",
	"MKTTL - Division 3",
	"MKTTL - Division 4",
	"MKTTL - Division 5",
	"MKTTL - Division 6",
	"MKTTL - Division 7",
	"Not in a league",
] as const;

const baseRating = 1000;

export function initialRating(division?: (typeof leagueDivisions)[number]) {
	if (!division) {
		return baseRating;
	}
	const index = leagueDivisions.indexOf(division);
	if (index === -1) {
		return baseRating;
	}
	return baseRating - index * 100;
}
