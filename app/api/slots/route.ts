import { db } from "@/lib/firebase/firebase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const parlor = searchParams.get("parlor");
	const machine = searchParams.get("machine");

	if (!parlor || !machine) {
		return NextResponse.json(
			{ error: "パーラーまたはマシンが指定されていません" },
			{ status: 400 },
		);
	}

	try {
		const slotDocRef = db.collection("slots").doc(parlor);
		const slotsSnapshot = await slotDocRef
			.collection("data")
			.where("machineId", "==", machine)
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

		const uniqueSlotNumbers = Array.from(
			new Set(dataList.map((item) => item.slotNumber)),
		);

		const groupedData = dataList.reduce(
			(acc, item) => {
				const yearMonth = `${item.year}-${item.month}`;
				if (!acc[yearMonth]) {
					acc[yearMonth] = [];
				}
				acc[yearMonth].push(item);
				return acc;
			},
			{} as Record<string, typeof dataList>,
		);

		const groupedSlotData = Object.entries(groupedData)
			.map(([key, value]) => {
				const uniqueDates = Array.from(
					new Set(
						value.map((item) => `${item.year}-${item.month}-${item.day}`),
					),
				).sort((a, b) => {
					return new Date(a).getTime() - new Date(b).getTime();
				});

				const slotDataList = uniqueDates.map((date) => {
					const filteredData = value.filter(
						(item) => `${item.year}-${item.month}-${item.day}` === date,
					);
					const slots: { slotNumber: string; coin: string }[] = [];
					for (const uniqueSlotNumber of uniqueSlotNumbers) {
						const targetData = filteredData.find(
							(item) => item.slotNumber === uniqueSlotNumber,
						);
						slots.push({
							slotNumber: uniqueSlotNumber,
							coin: targetData ? targetData.coinDifference : "-",
						});
					}
					return {
						date,
						slots,
					};
				});

				const totalData = uniqueSlotNumbers.map((slotNumber) => {
					const total = value
						.filter((item) => item.slotNumber === slotNumber)
						.reduce((acc, item) => {
							const coinDifferenceValue = Number.parseFloat(
								item.coinDifference.replace(/,/g, ""),
							);
							if (coinDifferenceValue >= 5000) {
								return acc + 3;
							}
							if (coinDifferenceValue >= 3000) {
								return acc + 2;
							}
							if (coinDifferenceValue >= 1000) {
								return acc + 1;
							}
							return acc;
						}, 0);

					return {
						slotNumber: slotNumber,
						coin: total.toString(),
					};
				});

				slotDataList.push({
					date: "合計",
					slots: totalData,
				});

				return {
					yearMonth: key,
					slotDataList,
				};
			})
			.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

		return NextResponse.json({ dataList, groupedSlotData });
	} catch (error) {
		console.error("Firestoreの取得中にエラーが発生しました:", error);
		return NextResponse.json(
			{ error: "データの取得に失敗しました" },
			{ status: 500 },
		);
	}
}
