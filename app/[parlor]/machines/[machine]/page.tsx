"use server";

import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/firebase/firebase";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { ExportCSVButton } from "./ExportCSVButton"; // クライアントコンポーネントをインポート

const CACHE_EXPIRY = 12 * 60 * 60 * 1000;

export default async function Page({
	params,
}: {
	params: Promise<{ parlor: string; machine: string }>;
}) {
	const { parlor, machine } = await params;

	const headersList = await headers();
	const origin = `${headersList.get("x-forwarded-proto")}://${headersList.get("x-forwarded-host")}`;

	const response = await fetch(
		`${origin}/api/slots?parlor=${parlor}&machine=${machine}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			next: { revalidate: CACHE_EXPIRY / 1000 },
		},
	);

	const GroupedSlotData = (await response.json()) as {
		parlourName: string;
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
					gameCount: string;
					bb: string;
					rb: string;
					rate: string;
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
			<h1 className="mb-4">
				{`${machineData?.name}（${GroupedSlotData.parlourName}）`}
			</h1>
			{GroupedSlotData.groupedSlotData?.map((data) => (
				<div key={uuidv4()} className="mb-8">
					<h2 className="mb-4">
						{data.yearMonth}（総差枚:{" "}
						{data.slotDataList
							.reduce((acc, curr) => {
								if (curr.date === "レート" || curr.date === "合計") return acc;
								const totalDiff = curr.slots.reduce((slotAcc, slot) => {
									const value = slot.coin.replace(/,/g, "");
									if (value === "-") return slotAcc;
									return (
										slotAcc +
										(value.startsWith("+") ? 1 : -1) *
											Number.parseFloat(value.replace(/[+\-]/g, ""))
									);
								}, 0);
								return acc + totalDiff;
							}, 0)
							.toLocaleString("ja-JP")}
						）
					</h2>
					<div className="mb-6 flex justify-between items-center">
						<Link
							href={`/${parlor}/machines`}
							className="flex items-center text-sm text-gray-500 hover:text-gray-700"
						>
							<ArrowLeft className="h-4 w-4 mr-1" />
							機種一覧に戻る
						</Link>
						<ExportCSVButton
							data={data}
							machineName={machineData?.name || ""}
							parlourName={GroupedSlotData.parlourName}
						/>
					</div>
					<Table className="min-w-full w-full mb-16">
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
									<TableCell className="font-medium p-2">
										{data.date === "レート" || data.date === "合計"
											? data.date
											: format(
													data.date.includes("-")
														? new Date(data.date)
														: new Date(
																`${data.date.slice(0, 4)}-${data.date.slice(4, 6)}-${data.date.slice(6, 8)}`,
															),
													"yyyy/MM/dd(E)",
													{
														locale: ja,
													},
												)}
									</TableCell>
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
													color: data.date === "レート" ? "red" : "black",
													fontWeight:
														data.date === "レート" || data.date === "合計"
															? "bold"
															: "normal",
												}}
												className="p-2 w-[30px]"
											>
												{data.date !== "レート" ? (
													<>
														<span className="text-xs">{slot.coin}</span>
														<br />
														<span className="text-xs">
															{slot.gameCount === "-"
																? ""
																: `(${slot.gameCount})`}
														</span>
													</>
												) : (
													slot.coin
												)}
											</TableCell>
										);
									})}
								</TableRow>
							))}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell colSpan={data.slotDataList.length + 1}>
									※各データには、「差枚（上）」と「回転数（下）」を表記しています
								</TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</div>
			))}
		</div>
	);
}
