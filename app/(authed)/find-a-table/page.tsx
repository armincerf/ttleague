"use client";

export default function FindATablePage() {
	return (
		<iframe
			src="/pingpongmap.html"
			style={{
				width: "100vw",
				height: "calc(100dvh - 128px)",
				marginTop: "63px",
				border: "none",
				position: "fixed",
				top: 0,
				left: 0,
			}}
			title="Ping Pong Map"
		/>
	);
}
