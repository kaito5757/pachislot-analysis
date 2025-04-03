"use server";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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
			<h1 className="mb-4">{parlourData.parlourName}</h1>
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
					{["202501", "202502", "202503", "202504"].map((i) => {
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
