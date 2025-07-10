import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function page() {
	return (
		<div className="p-4">
			<Table className="min-w-full w-full mb-16">
				<TableHeader>
					<TableRow>
						<TableHead>設定</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell className="font-medium p-2">
							<Link href={"/setting/parlor"} className="w-full block">
								店舗追加
							</Link>
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell className="font-medium p-2">
							<Link href={"/setting/machines"} className="w-full block">
								機種更新
							</Link>
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell className="font-medium p-2">
							<Link href={"/setting/data-deletion"} className="w-full block">
								データ削除
							</Link>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>
	);
}
