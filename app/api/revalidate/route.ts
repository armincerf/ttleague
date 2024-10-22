import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const path = searchParams.get("path");
	const tag = searchParams.get("tag");

	if (path) {
		revalidatePath(path);
		return NextResponse.json({ revalidated: true, now: Date.now() });
	}

	if (tag) {
		revalidateTag(tag);
		return NextResponse.json({ revalidated: true, now: Date.now() });
	}

	return NextResponse.json(
		{ message: "Missing path or tag parameter" },
		{ status: 400 },
	);
}
