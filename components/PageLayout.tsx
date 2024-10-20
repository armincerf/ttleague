import type { ReactNode } from "react";

interface PageLayoutProps {
	children: ReactNode;
}

function PageLayout({ children }: PageLayoutProps) {
	return (
		<div className="h-[calc(100dvh-128px)] flex flex-col px-4 py-8 pb-0">
			{children}
		</div>
	);
}

export default PageLayout;
