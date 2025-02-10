"use client";

import { useState } from "react";
import { scraping } from "./action";

export default function Page() {
	const [inputData, setInputData] = useState<string>("20250101");
	const [message, setMessage] = useState<string>("");

	const handleSubmit = async (event: { preventDefault: () => void }) => {
		event.preventDefault();
		setMessage("スクレイピング中...");
		await scraping(inputData);
		setMessage("スクレイピングが完了しました！");

		setTimeout(() => {
			setMessage("");
		}, 2000);
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<form
				onSubmit={handleSubmit}
				className="bg-gray-100 p-4 rounded shadow-md"
			>
				<input
					type="text"
					value={inputData}
					onChange={(e) => setInputData(e.target.value)}
					placeholder="例）20250209"
					className="border border-gray-300 p-2 rounded mb-2"
				/>
				<button
					type="submit"
					className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
				>
					スクレピング
				</button>
			</form>
			{message && <p className="mt-4 text-green-500">{message}</p>}
		</div>
	);
}
