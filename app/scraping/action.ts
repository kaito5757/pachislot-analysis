"use server";

import axios from "axios";
import { load } from "cheerio"; // cheerioをインポート
import { db } from "../../lib/firebase/firebase"; // Firestoreのインスタンスをインポート

const targetParlour =
	"e382a8e382b9e38391e382b9e697a5e68b93e6b88be8b0b7e9a785e5898de696b0e9a4a8code";

export async function scraping(targetDate: string) {
	console.log("スクレイピング開始");

	const targetMachines = await getMachineForParlour(targetParlour);
	if (!targetMachines) return;

	const dataList: {
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
	}[] = [];

	for (const machine of targetMachines) {
		const response = await axios.get(
			`https://www.slorepo.com/hole/${targetParlour}/${targetDate}/kishu/?kishu=${machine.name}`,
		);
		const $ = load(response.data);

		$(".table2 tr").each((index, element) => {
			if (index === 0) return;
			if ($(element).find("td").eq(0).text().trim() === "平均") return;
			const rowData = {
				machineId: machine.id,
				year: targetDate.slice(0, 4),
				month: targetDate.slice(4, 6),
				day: targetDate.slice(6, 8),
				slotNumber: $(element).find("td").eq(0).text().trim(),
				coinDifference: $(element).find("td").eq(1).text().trim(),
				gameCount: $(element).find("td").eq(2).text().trim(),
				bb: $(element).find("td").eq(3).text().trim(),
				rb: $(element).find("td").eq(4).text().trim(),
				rate: $(element).find("td").eq(5).text().trim(),
			};
			dataList.push(rowData);
		});
	}

	await addSlots(targetParlour, dataList);
}

async function addSlots(
	parlourId: string,
	data: {
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
	}[],
) {
	try {
		const slotDocRef = db.collection("slots").doc(parlourId);
		const subCollectionRef = slotDocRef.collection("data");

		for (const slot of data) {
			const docRef = await subCollectionRef.add(slot);
			console.log("Sub-collection document written with ID: ", docRef.id);
		}
	} catch (error) {
		console.error("Error adding sub-collection document: ", error);
	}
}

const getMachineForParlour = async (parlourId: string) => {
	const docRef = db.collection("parlours").doc(parlourId);
	const doc = await docRef.get();

	if (!doc.exists) {
		return null;
	}

	const subCollectionRef = docRef.collection("machines");
	const subCollectionSnapshot = await subCollectionRef.get();

	return subCollectionSnapshot.docs.map((subDoc) => ({
		id: subDoc.id,
		...subDoc.data(),
	})) as { id: string; name: string }[];
};
