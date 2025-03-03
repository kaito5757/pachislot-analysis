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
import Link from "next/link";

export default async function Home() {
	const parlourDoc = await db.collection("parlours").get();

	const parlourData = parlourDoc.docs.map((doc) => ({
		id: doc.id,
		name: doc.data().name,
	}));

	return (
		<div className="p-4">
			<Table className="mb-16">
				<TableHeader>
					<TableRow>
						<TableHead>店舗</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{parlourData.map((parlour) => (
						<TableRow key={parlour.id}>
							<TableCell className="font-medium p-2">
								<Link href={`/${parlour.id}`}>{parlour.name}</Link>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
