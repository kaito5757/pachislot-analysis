import { db } from "@/lib/firebase/firebase";
import { date } from "@formkit/tempo";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const parlour = searchParams.get("parlour");
	const year = searchParams.get("year");
	const month = searchParams.get("month");

	if (!parlour || !year || !month) {
		return NextResponse.json(
			{ error: "パーラーまたは年月が指定されていません" },
			{ status: 400 },
		);
	}

	const parlourDocRef = db.collection("parlours").doc(parlour);
	const parlourDoc = await parlourDocRef.get();
	const machinesSnapshot = await parlourDocRef.collection("machines").get();
	const machines = machinesSnapshot.docs.map((doc) => ({
		id: doc.id,
		name: doc.data().name as string,
	}));

	try {
		const slotDocRef = db.collection("slots").doc(parlour);
		const slotsSnapshot = await slotDocRef
			.collection("data")
			.where("year", "==", year)
			.where("month", "==", month)
			.get();

		if (slotsSnapshot.empty) {
			return NextResponse.json({ data: [] });
		}

		const dataList = slotsSnapshot.docs
			.map((doc) => ({
				machineId: doc.data().machineId,
				year: doc.data().year,
				month: doc.data().month,
				day: doc.data().day,
				slotNumber: doc.data().slotNumber,
				coinDifference: doc.data().coinDifference,
				gameCount: doc.data().gameCount,
				bb: doc.data().bb,
				rb: doc.data().rb,
				rate: doc.data().rate,
			}))
			.sort((a, b) => a.slotNumber - b.slotNumber);

		const groupedData = dataList.reduce(
			(acc, item) => {
				if (!acc[item.machineId]) {
					acc[item.machineId] = [];
				}
				acc[item.machineId].push(item);
				return acc;
			},
			{} as Record<string, typeof dataList>,
		);

		const groupedSlotData = Object.entries(groupedData).map(([key, value]) => {
			const total = value.reduce((acc, item) => {
				const coinDiff = String(item.coinDifference).replace(/,/g, "");
				return acc + Number(coinDiff);
			}, 0);

			const lastDay = new Date(Number(year), Number(month) + 1, 0).getDate();
			const machineNum =
				month === (date().getMonth() + 1).toString().padStart(2, "0")
					? value.filter(
							(item) => item.day === (date().getDate() - 1).toString(),
						).length
					: value.filter((item) => item.day === lastDay.toString()).length;

			const gameCount = value.reduce((acc, item) => {
				const games = String(item.gameCount).replace(/,/g, "");
				return acc + Number(games);
			}, 0);
			const name = machines.find((machine) => machine.id === key)?.name ?? "";
			return {
				machineId: key,
				name,
				machineNum,
				total,
				gameCount,
			};
		});

		return NextResponse.json({
			parlourName: parlourDoc.data()?.name,
			groupedSlotData,
		});
	} catch (error) {
		console.error("Firestoreの取得中にエラーが発生しました:", error);
		return NextResponse.json(
			{ error: "データの取得に失敗しました" },
			{ status: 500 },
		);
	}
}
