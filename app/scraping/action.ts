"use server";

import { format } from "@formkit/tempo";
import axios from "axios";
import { load } from "cheerio";
import { db } from "../../lib/firebase/firebase";

export async function scraping(parlourId: string, date: Date) {
	const slotData = await getSlotByDate(
		parlourId,
		format(date, "YYYY", "ja"),
		format(date, "MM", "ja"),
		format(date, "DD", "ja"),
	);
	if (slotData) {
		throw new Error("すでにこの日付のデータが存在しています");
	}

	console.log("スクレイピング開始");

	const targetMachines = await getMachineForParlour(parlourId);
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
			`https://www.slorepo.com/hole/${parlourId}/${format(date, "YYYYMMDD", "ja")}/kishu/?kishu=${machine.name}`,
		);
		const $ = load(response.data);

		const firstTable = $(".table2");

		if (firstTable.length === 1) continue;
		firstTable
			.first()
			.find("tr")
			.each((index, element) => {
				if (index === 0) return;
				if ($(element).find("td").eq(0).text().trim() === "平均") return;
				const rowData = {
					machineId: machine.id,
					year: format(date, "YYYY", "ja"),
					month: format(date, "MM", "ja"),
					day: format(date, "DD", "ja"),
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

	await addSlots(parlourId, dataList);
}

const getSlotByDate = async (
	parlourId: string,
	year: string,
	month: string,
	day: string,
) => {
	const slotDocRef = db.collection("slots").doc(parlourId);
	const subCollectionRef = slotDocRef.collection("data");

	// 指定された日付のデータをクエリ
	const querySnapshot = await subCollectionRef
		.where("year", "==", year)
		.where("month", "==", month)
		.where("day", "==", day)
		.limit(1)
		.get();

	if (querySnapshot.empty) {
		return null;
	}
	return querySnapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data(),
	}));
};

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
