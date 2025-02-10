"use server";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/firebase/firebase";
import { v4 as uuidv4 } from "uuid";

const CACHE_EXPIRY = 12 * 60 * 60 * 1000;

export default async function Page({
	params,
}: {
	params: Promise<{ parlor: string; machine: string }>;
}) {
	const { parlor, machine } = await params;

	const response = await fetch(
		`${process.env.PUBLIC_NEXT_API_URL}/api/slots?parlor=${parlor}&machine=${machine}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			next: { revalidate: CACHE_EXPIRY / 1000 },
		},
	);

	const GroupedSlotData = (await response.json()) as {
		dataList: {
			machineId: string;
			year: string;
			month: string;
			day: string;
			slotNumber: string;
			coinDifference: string;
			gameCount: string;
			bb: string;
			rb: string;
			rate: string;
		}[];
		groupedSlotData: {
			yearMonth: string;
			slotDataList: {
				date: string;
				slots: {
					slotNumber: string;
					coin: string;
				}[];
			}[];
		}[];
	};

	const parlourDocRef = db.collection("parlours").doc(parlor);
	const machineDoc = await parlourDocRef
		.collection("machines")
		.doc(machine)
		.get();
	const machineData = machineDoc.data();

	return (
		<div className="p-4">
			<h1 className="mb-4">{machineData?.name ?? ""}</h1>
			{GroupedSlotData.groupedSlotData.map((data) => (
				<div key={uuidv4()} className="mb-8">
					<h2 className="mb-4">{data.yearMonth}</h2>
					<Table className="min-w-full w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="w-[80px] p-2">日付</TableHead>
								{Array.from(
									new Set(
										GroupedSlotData.dataList.map((item) => item.slotNumber),
									),
								).map((slotNumber) => (
									<TableHead key={uuidv4()} className="w-[20px]">
										{slotNumber}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.slotDataList.map((data) => (
								<TableRow key={uuidv4()}>
									<TableCell className="font-medium p-2">{data.date}</TableCell>
									{data.slots.map((slot) => {
										const coinDifferenceValue = Number.parseFloat(
											slot.coin.replace(/,/g, ""),
										);
										return (
											<TableCell
												key={uuidv4()}
												style={{
													backgroundColor:
														coinDifferenceValue >= 5000
															? "red"
															: coinDifferenceValue >= 3000
																? "orange"
																: coinDifferenceValue >= 1000
																	? "yellow"
																	: "transparent",
													color: data.date === "合計" ? "red" : "black",
												}}
												className="p-2 w-[30px]"
											>
												{slot.coin}
											</TableCell>
										);
									})}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			))}
		</div>
	);
}
