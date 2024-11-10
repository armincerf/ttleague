import type { ReactNode } from "react";

interface PageLayoutProps {
	children: ReactNode;
}

function PageLayout({ children }: PageLayoutProps) {
	return <div className="flex flex-col px-4 my-[64px]">{children}</div>;
}

export default PageLayout;
