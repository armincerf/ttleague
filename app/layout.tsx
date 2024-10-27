import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ZoomResetButton from "@/components/ZoomResetButton";

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

const heoric = localFont({
	src: "./fonts/heroic-condensed-medium.woff",
	variable: "--font-heoric",
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
				className={`${geistSans.variable} ${geistMono.variable} ${heoric.variable} antialiased`}
			>
				{children}
				<Toaster />
				<SpeedInsights />
				<ZoomResetButton />
			</body>
		</html>
	);
}

export default RootLayout;
