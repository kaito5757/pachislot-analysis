"use server";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Link from "next/link";

const CACHE_EXPIRY = 12 * 60 * 60 * 1000;

export default async function Page({
	params,
}: {
	params: Promise<{ parlor: string }>;
}) {
	const { parlor } = await params;

	const response = await fetch(
		`https://pachislot-analysis.vercel.app/api/parlours?parlor=${parlor}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			next: { revalidate: CACHE_EXPIRY / 1000 },
		},
	);

	const machineData = (await response.json()) as {
		parlourName: string;
		machineData: {
			id: string;
			name: string;
		}[];
	};

	return (
		<div className="p-4">
			<h1 className="mb-4">{machineData.parlourName}</h1>
			<Table className="min-w-full w-full">
				<TableHeader>
					<TableRow>
						<TableHead>機種</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{machineData.machineData.map((data) => (
						<TableRow key={data.id}>
							<TableCell className="font-medium p-2">
								<Link href={`/${parlor}/${data.id}`} className="w-full block">
									{data.name}
								</Link>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
