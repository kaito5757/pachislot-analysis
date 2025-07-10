"use server";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { format, subMonths } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

const CACHE_EXPIRY = 12 * 60 * 60 * 1000;

export default async function Page({
	params,
}: {
	params: Promise<{ parlor: string }>;
}) {
	const { parlor } = await params;

	const headersList = await headers();
	const origin = `${headersList.get("x-forwarded-proto")}://${headersList.get("x-forwarded-host")}`;

	const response = await fetch(`${origin}/api/parlour?parlor=${parlor}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
		next: { revalidate: CACHE_EXPIRY / 1000 },
	});

	const parlourData = (await response.json()) as {
		parlourName: string;
		totalData: {
			year: string;
			month: string;
			total: number;
		}[];
	};

	return (
		<div className="p-4">
			<h1 className="mb-4">
				{parlourData.parlourName}（
				<Link
					href={`https://www.slorepo.com/hole/${parlor}`}
					className="text-blue-600 hover:text-blue-800 hover:underline mb-6 inline-flex items-center"
					target="_blank"
				>
					スロレポで確認する
				</Link>
				）
			</h1>
			<div className="mb-6">
				<Link
					href={`/${parlor}`}
					className="flex items-center text-sm text-gray-500 hover:text-gray-700"
				>
					<ArrowLeft className="h-4 w-4 mr-1" />
					店舗TOPに戻る
				</Link>
			</div>
			<Table className="min-w-full w-full mb-16">
				<TableHeader>
					<TableRow>
						<TableHead>月別差枚ランキング</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{generateMonthArray().map((i) => {
						return (
							<TableRow key={i}>
								<TableCell className="font-medium p-2">
									<Link
										key={i}
										href={`/${parlor}/total/${i}`}
										className="w-full block"
									>
										{i}
									</Link>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}

const generateMonthArray = (monthsCount = 6): string[] => {
	const months: string[] = [];
	const today = new Date();

	for (let i = monthsCount - 1; i >= 0; i--) {
		const targetDate = subMonths(today, i);
		const yearMonth = format(targetDate, "yyyyMM");
		months.push(yearMonth);
	}

	return months;
};
