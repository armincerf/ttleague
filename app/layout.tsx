import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import PostHogPageView from "./PostHogPageView";
import { PHProvider } from "./providers";
import { Suspense } from "react";

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
				{/* iPhone Splash Screens */}
				<link
					rel="apple-touch-startup-image"
					media="screen and (device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
					href="splash_screens/iPhone_16_Pro_Max_landscape.png"
				/>
				<link
					rel="apple-touch-startup-image"
					media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
					href="splash_screens/iPhone_16_Pro_landscape.png"
				/>
				{/* ... Add all other iPhone landscape splash screens ... */}

				{/* iPad Splash Screens */}
				<link
					rel="apple-touch-startup-image"
					media="screen and (device-width: 1032px) and (device-height: 1376px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
					href="splash_screens/13__iPad_Pro_M4_landscape.png"
				/>
				<link
					rel="apple-touch-startup-image"
					media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
					href="splash_screens/12.9__iPad_Pro_landscape.png"
				/>
				{/* ... Add all other iPad landscape splash screens ... */}

				{/* Portrait Orientation Splash Screens */}
				<link
					rel="apple-touch-startup-image"
					media="screen and (device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
					href="splash_screens/iPhone_16_Pro_Max_portrait.png"
				/>
				<link
					rel="apple-touch-startup-image"
					media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
					href="splash_screens/iPhone_16_Pro_portrait.png"
				/>
				{/* ... Add all other portrait splash screens ... */}
			</head>
			<PHProvider>
				<body
					className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-y-auto h-screen relative`}
					style={{ height: "100dvh" }}
				>
					<Suspense fallback={null}>
						<PostHogPageView />
					</Suspense>
					{children}
					<Toaster />
				</body>
			</PHProvider>
		</html>
	);
}

export default RootLayout;
