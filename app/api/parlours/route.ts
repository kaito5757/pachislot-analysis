import { db } from "@/lib/firebase/firebase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const parlor = searchParams.get("parlor");

	if (!parlor) {
		return NextResponse.json(
			{ error: "パーラーが指定されていません" },
			{ status: 400 },
		);
	}

	const parlourDocRef = db.collection("parlours").doc(parlor);
	const parlourName = await parlourDocRef.get();
	const machineDoc = await parlourDocRef.collection("machines").get();

	const machineData = machineDoc.docs.map((doc) => ({
		id: doc.id,
		name: doc.data().name,
	}));

	return NextResponse.json({
		parlourName: parlourName.data()?.name,
		machineData,
	});
}
