"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { updateMachines } from "../parlor/action";

interface Parlour {
	id: string;
	name: string;
}

interface MachineComparison {
	added: string[];
	removed: { id: string; name: string }[];
	existing: { id: string; name: string }[];
	totalCurrent: number;
	totalLatest: number;
}

export default function UpdateMachinesForm({
	parlours,
}: { parlours: Parlour[] }) {
	const [selectedParlour, setSelectedParlour] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const [comparison, setComparison] = useState<MachineComparison | null>(null);
	const [message, setMessage] = useState<string>("");

	const handlePreview = async () => {
		if (!selectedParlour) {
			setMessage("店舗を選択してください");
			return;
		}

		setIsLoading(true);
		setMessage("");

		try {
			const result = await updateMachines(selectedParlour);
			setComparison(result);
			setMessage("機種更新が完了しました");
		} catch (error) {
			setMessage(
				`エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
			);
		} finally {
			setIsLoading(false);
		}
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
						<Select value={selectedParlour} onValueChange={setSelectedParlour}>
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
						onClick={handlePreview}
						disabled={isLoading || !selectedParlour}
						className="w-full"
					>
						{isLoading ? "更新中..." : "機種更新を実行"}
					</Button>

					{message && (
						<div
							className={`p-3 rounded-md ${
								message.includes("エラー")
									? "bg-red-100 text-red-700"
									: "bg-green-100 text-green-700"
							}`}
						>
							{message}
						</div>
					)}
				</CardContent>
			</Card>

			{comparison && (
				<Card>
					<CardHeader>
						<CardTitle>機種更新結果</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="font-semibold">更新前の機種数</p>
									<p className="text-2xl">{comparison.totalCurrent}</p>
								</div>
								<div>
									<p className="font-semibold">更新後の機種数</p>
									<p className="text-2xl">{comparison.totalLatest}</p>
								</div>
							</div>

							{comparison.added.length > 0 && (
								<div>
									<p className="font-semibold text-green-600 mb-2">
										追加された機種 ({comparison.added.length}台)
									</p>
									<ul className="list-disc list-inside space-y-1 text-sm">
										{comparison.added.map((machine, index) => (
											<li key={index} className="text-green-700">
												{machine}
											</li>
										))}
									</ul>
								</div>
							)}

							{comparison.removed.length > 0 && (
								<div>
									<p className="font-semibold text-red-600 mb-2">
										削除された機種 ({comparison.removed.length}台)
									</p>
									<ul className="list-disc list-inside space-y-1 text-sm">
										{comparison.removed.map((machine, index) => (
											<li key={index} className="text-red-700">
												{machine.name}
											</li>
										))}
									</ul>
								</div>
							)}

							{comparison.existing.length > 0 && (
								<div>
									<p className="font-semibold text-blue-600 mb-2">
										継続する機種 ({comparison.existing.length}台)
									</p>
									<ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
										{comparison.existing.map((machine, index) => (
											<li key={index} className="text-blue-700">
												{machine.name}
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
