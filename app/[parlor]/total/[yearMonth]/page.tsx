"use server";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { date } from "@formkit/tempo";
import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

const CACHE_EXPIRY = 12 * 60 * 60 * 1000;

export default async function Page({
	params,
}: {
	params: Promise<{ parlor: string; yearMonth: string }>;
}) {
	const { parlor, yearMonth } = await params;

	const year = yearMonth.slice(0, 4);
	const month = yearMonth.slice(4);

	const headersList = await headers();
	const origin = `${headersList.get("x-forwarded-proto")}://${headersList.get("x-forwarded-host")}`;

	const response = await fetch(
		`${origin}/api/total?parlour=${parlor}&year=${year}&month=${month}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			next: { revalidate: CACHE_EXPIRY / 1000 },
		},
	);

	const parlourData = (await response.json()) as {
		parlourName: string;
		groupedSlotData?: {
			machineId: string;
			name: string;
			machineNum: number;
			total: number;
			gameCount: number;
		}[];
	};
	console.log(parlourData.groupedSlotData);

	const targetDay =
		month === (date().getMonth() + 1).toString().padStart(2, "0")
			? date().getDate() - 1
			: new Date(Number(year), Number(month) + 1, 0).getDate();
	console.log(targetDay);

	return (
		<div className="p-4">
			<h1 className="mb-4">{`${year}年${month}月 差枚ランキング（${parlourData.parlourName}）`}</h1>
			<div className="mb-6">
				<Link
					href={`/${parlor}/total`}
					className="flex items-center text-sm text-gray-500 hover:text-gray-700"
				>
					<ArrowLeft className="h-4 w-4 mr-1" />
					月別差枚ランキングに戻る
				</Link>
			</div>
			<Table className="min-w-full w-full mb-16">
				<TableHeader>
					<TableRow>
						<TableHead>機種名</TableHead>
						<TableHead>
							<div>
								機種台数
								<br />（{targetDay}日時点）
							</div>
						</TableHead>

						<TableHead>
							平均差枚数
							<br />（{targetDay}日分 / 1台）
						</TableHead>
						<TableHead>
							平均差枚数
							<br />（{targetDay}日分 / 全台）
						</TableHead>
						<TableHead>
							平均回転数
							<br />
							（1日分 / 全台）
						</TableHead>
						<TableHead>
							平均回転数
							<br />（{targetDay}日分 / 全台）
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{parlourData.groupedSlotData
						? parlourData.groupedSlotData
								.sort((a, b) => b.total - a.total)
								.map((data) => {
									return (
										<TableRow key={data.machineId}>
											<TableCell className="font-medium p-2">
												<Link
													href={`/${parlor}/machines/${data.machineId}`}
													className="hover:underline"
												>
													{data.name}
												</Link>
											</TableCell>
											<TableCell className="font-medium p-2">
												{data.machineNum}
											</TableCell>
											<TableCell className="font-medium p-2">
												{data.machineNum &&
													(data.total / data.machineNum)
														.toFixed(0)
														.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
											</TableCell>
											<TableCell className="font-medium p-2">
												{data.total.toLocaleString("ja-JP")}
											</TableCell>
											<TableCell className="font-medium p-2">
												{data.machineNum &&
													(data.gameCount / data.machineNum / targetDay)
														.toFixed(0)
														.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
											</TableCell>
											<TableCell className="font-medium p-2">
												{data.machineNum &&
													(data.gameCount / data.machineNum)
														.toFixed(0)
														.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
											</TableCell>
										</TableRow>
									);
								})
						: []}
				</TableBody>
			</Table>
		</div>
	);
}
