import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CSPostHogProvider } from './providers'; // Import the PostHog provider

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html className="max-h-[100dvh] overflow-hidden" lang="en">
			<head>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
				/>
				<script
					defer
					src="/bunseki.js"
					data-website-id="a8747a05-e034-47ec-a1fd-839f69723b03"
				/>
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<CSPostHogProvider>
					{children}
					<Toaster />
				</CSPostHogProvider>
			</body>
		</html>
	);
}

export default RootLayout;
