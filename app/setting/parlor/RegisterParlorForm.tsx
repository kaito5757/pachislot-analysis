"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerParlor } from "./action";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const FormSchema = z.object({
	parlourId: z.string().min(1, "店舗コードを入力してください"),
});

export default function RegisterParlorForm() {
	const [message, setMessage] = useState<string>("");
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			parlourId: "",
		},
	});

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		try {
			setMessage("登録中...");
			await registerParlor(data.parlourId);
			setMessage("登録が完了しました！");
		} catch (error: unknown) {
			if (error instanceof Error) {
				setMessage(error.message);
			} else {
				setMessage("エラーが発生しました");
			}
		}

		setTimeout(() => {
			setMessage("");
		}, 2000);
	};

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md p-6">
				<div className="mb-6">
					<Link
						href="/setting"
						className="flex items-center text-sm text-gray-500 hover:text-gray-700"
					>
						<ArrowLeft className="h-4 w-4 mr-1" />
						設定へ戻る
					</Link>
				</div>

				<Card>
					<CardHeader>
						<h2 className="text-2xl font-bold text-center">店舗登録</h2>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-4"
							>
								<FormField
									control={form.control}
									name="parlourId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>店舗コード</FormLabel>
											<FormControl>
												<Input placeholder="例）〇〇code" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button type="submit" className="w-full">
									登録する
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>

				{message && (
					<div className="mt-4 mx-auto max-w-md p-4 text-center rounded-lg bg-green-50 text-green-700">
						{message}
					</div>
				)}
			</div>
		</div>
	);
}
