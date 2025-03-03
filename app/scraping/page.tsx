"use server";

import { db } from "@/lib/firebase/firebase";
import { headers } from "next/headers";
import { Suspense } from "react";
import ScrapingForm from "./ScrapingForm";

export default async function Page() {
	const parlourDoc = await db.collection("parlours").get();

	const parlourData = parlourDoc.docs.map((doc) => ({
		id: doc.id,
		name: doc.data().name,
	}));

	const headersList = await headers();

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ScrapingForm
				parlours={parlourData}
				proto={headersList.get("x-forwarded-proto")}
			/>
		</Suspense>
	);
}
