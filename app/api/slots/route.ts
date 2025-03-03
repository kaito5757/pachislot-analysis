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

	const parlourDocRef = db.collection("parlours").doc(parlor);
	const parlourDoc = await parlourDocRef.get();

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
					const slots: {
						slotNumber: string;
						coin: string;
						gameCount: string;
					}[] = [];
					for (const uniqueSlotNumber of uniqueSlotNumbers) {
						const targetData = filteredData.find(
							(item) => item.slotNumber === uniqueSlotNumber,
						);
						slots.push({
							slotNumber: uniqueSlotNumber,
							coin: targetData ? targetData.coinDifference : "-",
							gameCount: targetData ? targetData.gameCount : "-",
						});
					}
					return {
						date,
						slots,
					};
				});

				const totalData = uniqueSlotNumbers.map((slotNumber) => {
					const [rate, total, gameCount] = value
						.filter((item) => item.slotNumber === slotNumber)
						.reduce(
							(acc, item) => {
								const rawValue = item.coinDifference.replace(/,/g, "");
								const coinDifferenceValue =
									rawValue === "-" ? 0 : Number.parseFloat(rawValue);
								const rawGameCount = item.gameCount
									.toString()
									.replace(/,/g, "");
								const gameCountValue =
									rawGameCount === "-" ? 0 : Number.parseInt(rawGameCount, 10);

								if (Number.isNaN(coinDifferenceValue)) {
									return acc;
								}

								let rateIncrement = 0;

								if (coinDifferenceValue >= 5000) {
									rateIncrement = 3;
								} else if (coinDifferenceValue >= 3000) {
									rateIncrement = 2;
								} else if (coinDifferenceValue >= 1000) {
									rateIncrement = 1;
								}
								return [
									acc[0] + rateIncrement,
									acc[1] + coinDifferenceValue,
									acc[2] + gameCountValue,
								];
							},
							[0, 0, 0],
						);

					return {
						slotNumber,
						rate,
						total: total.toLocaleString("ja-JP"),
						gameCount: gameCount.toLocaleString("ja-JP"),
					};
				});

				slotDataList.push({
					date: "合計",
					slots: totalData.map((item) => ({
						slotNumber: item.slotNumber,
						coin: item.total,
						gameCount: item.gameCount,
					})),
				});

				slotDataList.push({
					date: "レート",
					slots: totalData.map((item) => ({
						slotNumber: item.slotNumber,
						coin: item.rate.toString(),
						gameCount: item.gameCount,
					})),
				});

				return {
					yearMonth: key,
					slotDataList,
				};
			})
			.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

		return NextResponse.json({
			parlourName: parlourDoc.data()?.name,
			dataList,
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
