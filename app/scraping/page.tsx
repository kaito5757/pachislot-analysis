"use server";

import { db } from "@/lib/firebase/firebase";
import { Suspense } from "react";
import ScrapingForm from "./ScrapingForm";

export default async function Page() {
	const parlourDoc = await db.collection("parlours").get();

	const parlourData = parlourDoc.docs.map((doc) => ({
		id: doc.id,
		name: doc.data().name,
	}));

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ScrapingForm parlours={parlourData} />
		</Suspense>
	);
}
