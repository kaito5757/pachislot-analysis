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
					href="/"
					className="flex items-center text-sm text-gray-500 hover:text-gray-700"
				>
					<ArrowLeft className="h-4 w-4 mr-1" />
					店舗一覧に戻る
				</Link>
			</div>
			<Table className="min-w-full w-full mb-16">
				<TableHeader>
					<TableRow>
						<TableHead>データ</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell className="font-medium p-2">
							<Link href={`/${parlor}/total`} className="w-full block">
								月別差枚ランキング
							</Link>
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell className="font-medium p-2">
							<Link href={`/${parlor}/machines`} className="w-full block">
								機種データ
							</Link>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>
	);
}
