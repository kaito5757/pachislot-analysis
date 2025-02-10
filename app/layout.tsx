"use client";

import { NavBar } from "@/components/NavBer";
import ProgressBarProvider from "@/components/ProgressBarProvider";
import { CirclePlus, Home, Settings } from "lucide-react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const navItems = [
		{ name: "ホーム", url: "/", icon: Home },
		{ name: "設定", url: "/setting", icon: Settings },
		{ name: "スクレイピング", url: "/scraping", icon: CirclePlus },
	];

	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased sm:pt-20`}
			>
				<NavBar items={navItems} />
				<ProgressBarProvider>{children}</ProgressBarProvider>
			</body>
		</html>
	);
}
