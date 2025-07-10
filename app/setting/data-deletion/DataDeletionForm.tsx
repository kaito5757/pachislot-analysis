"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { deleteAllSlotData, getSlotDataCount } from "../parlor/action";

interface Parlour {
	id: string;
	name: string;
}

interface DataInfo {
	count: number;
	parlourName: string;
}

export default function DataDeletionForm({ parlours }: { parlours: Parlour[] }) {
	const [selectedParlour, setSelectedParlour] = useState<string>("");
	const [confirmationText, setConfirmationText] = useState<string>("");
	const [dataInfo, setDataInfo] = useState<DataInfo | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string>("");
	const [isDeleted, setIsDeleted] = useState(false);

	const handleLoadData = async () => {
		if (!selectedParlour) {
			setMessage("店舗を選択してください");
			return;
		}

		setIsLoading(true);
		setMessage("");

		try {
			const result = await getSlotDataCount(selectedParlour);
			setDataInfo(result);
			setIsDeleted(false);
		} catch (error) {
			setMessage(`エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!selectedParlour || !dataInfo) {
			setMessage("店舗を選択してデータを読み込んでください");
			return;
		}

		if (!confirmationText) {
			setMessage("確認のため店舗名を入力してください");
			return;
		}

		setIsLoading(true);
		setMessage("");

		try {
			const result = await deleteAllSlotData(selectedParlour, confirmationText);
			setMessage(`削除が完了しました: ${result.deletedCount}件のデータを削除`);
			setIsDeleted(true);
			setConfirmationText("");
		} catch (error) {
			setMessage(`エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
		} finally {
			setIsLoading(false);
		}
	};

	const handleParlourChange = (value: string) => {
		setSelectedParlour(value);
		setDataInfo(null);
		setConfirmationText("");
		setMessage("");
		setIsDeleted(false);
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>店舗選択</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="parlour">店舗</Label>
						<Select value={selectedParlour} onValueChange={handleParlourChange}>
							<SelectTrigger>
								<SelectValue placeholder="店舗を選択してください" />
							</SelectTrigger>
							<SelectContent>
								{parlours.map((parlour) => (
									<SelectItem key={parlour.id} value={parlour.id}>
										{parlour.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<Button 
						onClick={handleLoadData} 
						disabled={isLoading || !selectedParlour}
						className="w-full"
						variant="outline"
					>
						{isLoading ? "読み込み中..." : "データ数を確認"}
					</Button>

					{message && (
						<div className={`p-3 rounded-md ${
							message.includes("エラー") ? "bg-red-100 text-red-700" : 
							message.includes("削除が完了") ? "bg-green-100 text-green-700" :
							"bg-blue-100 text-blue-700"
						}`}>
							{message}
						</div>
					)}
				</CardContent>
			</Card>

			{dataInfo && !isDeleted && (
				<Card>
					<CardHeader>
						<CardTitle className="text-red-600">データ削除</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="p-4 bg-red-50 border border-red-200 rounded-md">
							<p className="font-semibold text-red-700">削除対象</p>
							<p className="text-red-600">店舗名: {dataInfo.parlourName}</p>
							<p className="text-red-600">データ数: {dataInfo.count}件</p>
						</div>

						<div>
							<Label htmlFor="confirmation">
								確認のため店舗名を入力してください: <strong>{dataInfo.parlourName}</strong>
							</Label>
							<Input
								id="confirmation"
								type="text"
								value={confirmationText}
								onChange={(e) => setConfirmationText(e.target.value)}
								placeholder="店舗名を入力"
								className="mt-1"
							/>
						</div>

						<Button 
							onClick={handleDelete} 
							disabled={isLoading || confirmationText !== dataInfo.parlourName}
							className="w-full"
							variant="destructive"
						>
							{isLoading ? "削除中..." : "データを削除"}
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}