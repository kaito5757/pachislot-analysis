"use client";

import { format } from "@formkit/tempo";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { scraping } from "./action";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const FormSchema = z.object({
	parlourId: z.string({
		required_error: "パーラーを選択してください",
	}),
	date: z.date({
		required_error: "日付を選択してください",
	}),
});

export default function ScrapingForm(props: {
	parlours: {
		id: string;
		name: string;
	}[];
}) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [message, setMessage] = useState<string>("");
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			parlourId: searchParams.get("parlourId") || undefined,
			date: searchParams.get("date")
				? new Date(searchParams.get("date") as string)
				: new Date(),
		},
	});

	// URLクエリパラメーターを更新する関数
	const updateQueryParams = (params: { date?: Date; parlourId?: string }) => {
		const urlParams = new URLSearchParams(searchParams.toString());

		if (params.date) {
			urlParams.set("date", format(params.date, "YYYY-MM-DD"));
		}
		if (params.parlourId) {
			urlParams.set("parlourId", params.parlourId);
		}

		router.push(`?${urlParams.toString()}`);
	};

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		setMessage("スクレイピング中...");
		try {
			await scraping(data.parlourId, data.date);
			setMessage("スクレイピングが完了しました！");
		} catch (error) {
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
		<div className="min-h-screen flex items-center justify-center">
			<div className="container mx-auto max-w-md p-6 relative min-h-[500px]">
				<Card>
					<CardHeader>
						<h2 className="text-2xl font-bold text-center">スクレイピング</h2>
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
											<FormLabel>パーラー</FormLabel>
											<Select
												onValueChange={(value) => {
													field.onChange(value);
													updateQueryParams({ parlourId: value });
												}}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="パーラーを選択" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{props.parlours.map((parlour) => (
														<SelectItem key={parlour.id} value={parlour.id}>
															{parlour.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>日付</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant={"outline"}
															className={cn(
																"w-full justify-start text-left font-normal",
																!field.value && "text-muted-foreground",
															)}
														>
															<CalendarIcon className="mr-2 h-4 w-4" />
															{field.value ? (
																format(field.value, "YYYY/MM/DD")
															) : (
																<span>日付を選択</span>
															)}
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0">
													<Calendar
														mode="single"
														selected={field.value}
														onSelect={(value: Date | undefined) => {
															if (value) {
																field.onChange(value);
																updateQueryParams({ date: value });
															}
														}}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button
									type="submit"
									className="w-full"
									disabled={process.env.VERCEL_ENV === "production"}
								>
									{process.env.VERCEL_ENV === "production"
										? "本番環境はタイムアウト問題でスクレイピングできません...（TODO: inngestで実装すれば解決できる）"
										: "スクレイピング"}
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
