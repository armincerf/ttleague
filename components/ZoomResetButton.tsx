"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function ZoomResetButton() {
	const [isZoomed, setIsZoomed] = useState(false);

	useEffect(() => {
		function checkZoom() {
			const zoomLevel = Math.round((window.visualViewport?.scale || 1) * 100);
			setIsZoomed(zoomLevel !== 100);
		}

		window.visualViewport?.addEventListener("resize", checkZoom);
		window.visualViewport?.addEventListener("scroll", checkZoom);

		return () => {
			window.visualViewport?.removeEventListener("resize", checkZoom);
			window.visualViewport?.removeEventListener("scroll", checkZoom);
		};
	}, []);

	if (!isZoomed) return null;

	function handleReset() {
		const viewport = document.querySelector('meta[name="viewport"]');
		if (!viewport) return;

		const originalContent = viewport.getAttribute("content");

		// First, enable zoom
		viewport.setAttribute(
			"content",
			"width=device-width, initial-scale=1, user-scalable=yes",
		);

		// Then force a reset to 1
		setTimeout(() => {
			viewport.setAttribute(
				"content",
				"width=device-width, initial-scale=1, maximum-scale=1",
			);

			// Finally restore original content
			setTimeout(() => {
				if (originalContent) {
					viewport.setAttribute("content", originalContent);
				}
			}, 300);
		}, 100);
	}

	return (
		<Button
			onClick={handleReset}
			className="fixed bottom-[4vh] right-[4vw] z-50 rounded-full shadow-lg"
			style={{ transform: "translate(0, 0)" }} // Prevents any automatic repositioning
		>
			Reset Zoom
		</Button>
	);
}

export default ZoomResetButton;
