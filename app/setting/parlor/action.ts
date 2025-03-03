"use server";

import { db } from "@/lib/firebase/firebase";
import { addDay, format } from "@formkit/tempo";
import axios from "axios";
import { load } from "cheerio";

export async function registerParlor(parlourId: string) {
	const parlour = await getParlour(parlourId);
	if (parlour) {
		throw new Error("すでに登録済みです");
	}

	const date = format(addDay(new Date(), -1), "YYYYMMDD", "ja");
	const response = await axios.get(
		`https://www.slorepo.com/hole/${parlourId}/${date}`,
	);
	const $ = load(response.data);

	const originalParlourName = $(".title strong").eq(0).text().trim();
	const datePattern = /\d{4}\/\d{1,2}\/\d{1,2}\(.\)\n?/;
	const parlourName = originalParlourName.replace(datePattern, "");

	const machineNames: string[] = [];
	$(".wp-block-table2 tr").each((index, element) => {
		if (index === 0) return;
		if ($(element).find("td").eq(0).text().trim() === "平均") return;
		const rowData = $(element).find("td").eq(0).text().trim();

		machineNames.push(rowData);
	});

	await addParlour(parlourId, parlourName, machineNames);
}

const getParlour = async (parlourId: string) => {
	const parlourDocRef = db.collection("parlours").doc(parlourId);
	const parlour = await parlourDocRef.get();
	return parlour.data();
};

async function addParlour(
	parlourId: string,
	parlourName: string,
	machineNames: string[],
) {
	try {
		const parlourDocRef = db.collection("parlours").doc(parlourId);
		await parlourDocRef.set({
			name: parlourName,
		});

		const subCollectionRef = parlourDocRef.collection("machines");

		for (const machineName of machineNames) {
			await subCollectionRef.add({
				name: machineName,
			});
			console.log(`Added machine: ${machineName}`);
		}

		console.log(`Successfully added parlour: ${parlourName}`);
	} catch (error) {
		console.error("Error adding parlour and machines: ", error);
	}
}
