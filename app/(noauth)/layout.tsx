import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
	title: "MK Table Tennis League - Sign Up",
	description: "Sign up to the Milton Keynes table tennis singles league",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <ClerkProvider>{children}</ClerkProvider>;
}
