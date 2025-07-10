import { db } from "@/lib/firebase/firebase";
import UpdateMachinesForm from "./UpdateMachinesForm";

export default async function page() {
	const parloursSnapshot = await db.collection("parlours").get();
	const parlours = parloursSnapshot.docs.map((doc) => ({
		id: doc.id,
		name: doc.data().name,
	}));

	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">機種更新</h1>
			<UpdateMachinesForm parlours={parlours} />
		</div>
	);
}
