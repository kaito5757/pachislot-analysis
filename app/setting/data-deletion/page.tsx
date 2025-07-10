import { db } from "@/lib/firebase/firebase";
import DataDeletionForm from "./DataDeletionForm";

export default async function page() {
	const parloursSnapshot = await db.collection("parlours").get();
	const parlours = parloursSnapshot.docs.map((doc) => ({
		id: doc.id,
		name: doc.data().name,
	}));

	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">データ削除</h1>
			<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
				<p className="text-red-700 font-semibold">⚠️ 注意</p>
				<p className="text-red-600">
					この操作は取り消せません。選択した店舗のスロットデータが全て削除されます。
				</p>
			</div>
			<DataDeletionForm parlours={parlours} />
		</div>
	);
}