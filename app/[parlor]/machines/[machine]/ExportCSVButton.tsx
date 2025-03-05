"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Download } from "lucide-react";

export function ExportCSVButton({
	data,
	machineName,
	parlourName,
}: {
	data: {
		yearMonth: string;
		slotDataList: {
			date: string;
			slots: {
				slotNumber: string;
				coin: string;
				gameCount: string;
				bb: string;
				rb: string;
				rate: string;
			}[];
		}[];
	};
	machineName: string;
	parlourName: string;
}) {
	const exportToCSV = () => {
		// 台番号を取得
		const slotNumbers = data.slotDataList[0].slots.map(
			(slot) => slot.slotNumber,
		);

		// ヘッダー行の作成（台番号のみ）
		const headers = ["日付", ""];
		for (const number of slotNumbers) {
			headers.push(number);
		}

		// データ行の作成
		const csvRows = [];
		csvRows.push(headers.join("\t")); // タブ区切りに変更

		// 日付ごとに5行のデータを作成（差枚、回転数、BB、RB、合成確率）
		for (const dayData of data.slotDataList) {
			// 合計とレートの行は除外
			if (dayData.date === "合計" || dayData.date === "レート") {
				continue;
			}

			let dateStr = dayData.date;

			// 日付の整形
			try {
				const dateObj = dateStr.includes("-")
					? new Date(dateStr)
					: new Date(
							`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`,
						);

				// 日付をYYYYMMDD形式に変更
				dateStr = format(dateObj, "yyyyMMdd", { locale: ja });
			} catch (e) {
				console.error("日付変換エラー:", e);
			}

			// 差枚データの行
			const coinRow = [dateStr, "差枚"];
			// 回転数データの行
			const gameCountRow = ["", "回転数"];
			// BB回数の行
			const bbRow = ["", "BB"];
			// RB回数の行
			const rbRow = ["", "RB"];
			// 合成確率の行
			const rateRow = ["", "合成確率"];

			// 各台のデータを追加
			for (const slot of dayData.slots) {
				// 差枚データを追加
				coinRow.push(slot.coin);

				// 回転数データを追加
				gameCountRow.push(slot.gameCount);

				// BB回数を追加
				bbRow.push(slot.bb || "-");

				// RB回数を追加
				rbRow.push(slot.rb || "-");

				// 合成確率を追加
				rateRow.push(slot.rate || "-");
			}

			// 行を追加
			csvRows.push(coinRow.join("\t"));
			csvRows.push(gameCountRow.join("\t"));
			csvRows.push(bbRow.join("\t"));
			csvRows.push(rbRow.join("\t"));
			csvRows.push(rateRow.join("\t"));
		}

		// BOMを追加してUTF-8で正しく表示されるようにする
		const BOM = "\uFEFF";
		const csvContent = BOM + csvRows.join("\n");

		// MIMEタイプをタブ区切りに変更
		const blob = new Blob([csvContent], {
			type: "text/tab-separated-values;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);

		// ダウンロードリンクの作成と実行
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			`${parlourName}_${machineName}_${data.yearMonth}.tsv`,
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<Button
			onClick={exportToCSV}
			variant="outline"
			size="sm"
			className="flex items-center gap-1"
		>
			<Download className="h-4 w-4" />
			データ出力
		</Button>
	);
}
