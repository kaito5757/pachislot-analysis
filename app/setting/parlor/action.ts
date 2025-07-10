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

	// 前日のデータを試行、なければ前々日を試行
	const dates = [
		format(addDay(new Date(), -1), "YYYYMMDD", "ja"), // 前日
		format(addDay(new Date(), -2), "YYYYMMDD", "ja"), // 前々日
	];

	for (const date of dates) {
		try {
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

			if (machineNames.length > 0) {
				await addParlour(parlourId, parlourName, machineNames);
				return;
			}
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 404) {
				// 404の場合は次の日付を試行
				continue;
			}
			// その他のエラーは再スロー
			throw error;
		}
	}

	// すべての日付で失敗した場合
	throw new Error(
		`データが見つかりません。店舗ID: ${parlourId}, 試行日付: ${dates.join(", ")}`,
	);
}

const getParlour = async (parlourId: string) => {
	const parlourDocRef = db.collection("parlours").doc(parlourId);
	const parlour = await parlourDocRef.get();
	return parlour.data();
};

export async function updateMachines(parlourId: string) {
	const parlour = await getParlour(parlourId);
	if (!parlour) {
		throw new Error("店舗が見つかりません");
	}

	// 現在の機種一覧を取得
	const currentMachines = await getCurrentMachines(parlourId);

	// 前日の機種一覧をスクレイピング
	const latestMachines = await getLatestMachines(parlourId);

	// 機種の差分を計算
	const comparison = compareMachines(currentMachines, latestMachines);

	// 機種を更新
	await updateMachinesInDb(parlourId, comparison);

	return comparison;
}

async function getCurrentMachines(parlourId: string) {
	const parlourDocRef = db.collection("parlours").doc(parlourId);
	const machinesRef = parlourDocRef.collection("machines");
	const snapshot = await machinesRef.get();

	return snapshot.docs.map((doc) => ({
		id: doc.id,
		name: doc.data().name,
	}));
}

async function getLatestMachines(parlourId: string) {
	// 前日のデータを試行、なければ前々日を試行
	const dates = [
		format(addDay(new Date(), -1), "YYYYMMDD", "ja"), // 前日
		format(addDay(new Date(), -2), "YYYYMMDD", "ja"), // 前々日
	];

	for (const date of dates) {
		try {
			const response = await axios.get(
				`https://www.slorepo.com/hole/${parlourId}/${date}`,
			);

			const $ = load(response.data);

			const machineNames: string[] = [];
			$(".wp-block-table2 tr").each((index, element) => {
				if (index === 0) return;
				if ($(element).find("td").eq(0).text().trim() === "平均") return;
				const rowData = $(element).find("td").eq(0).text().trim();
				machineNames.push(rowData);
			});

			if (machineNames.length > 0) {
				return machineNames;
			}
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 404) {
				// 404の場合は次の日付を試行
				continue;
			}
			// その他のエラーは再スロー
			throw error;
		}
	}

	// すべての日付で失敗した場合
	throw new Error(
		`データが見つかりません。店舗ID: ${parlourId}, 試行日付: ${dates.join(", ")}`,
	);
}

function compareMachines(
	currentMachines: { id: string; name: string }[],
	latestMachines: string[],
) {
	const currentNames = currentMachines.map((m) => m.name);

	const added = latestMachines.filter((name) => !currentNames.includes(name));
	const removed = currentMachines.filter(
		(m) => !latestMachines.includes(m.name),
	);
	const existing = currentMachines.filter((m) =>
		latestMachines.includes(m.name),
	);

	return {
		added,
		removed,
		existing,
		totalCurrent: currentMachines.length,
		totalLatest: latestMachines.length,
	};
}

async function updateMachinesInDb(
	parlourId: string,
	comparison: {
		added: string[];
		removed: { id: string; name: string }[];
		existing: { id: string; name: string }[];
	},
) {
	const parlourDocRef = db.collection("parlours").doc(parlourId);
	const machinesRef = parlourDocRef.collection("machines");

	// 削除された機種を削除
	for (const machine of comparison.removed) {
		await machinesRef.doc(machine.id).delete();
		console.log(`Removed machine: ${machine.name}`);
	}

	// 新しい機種を追加
	for (const machineName of comparison.added) {
		await machinesRef.add({
			name: machineName,
		});
		console.log(`Added machine: ${machineName}`);
	}

	console.log(`Successfully updated machines for parlour: ${parlourId}`);
}

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
