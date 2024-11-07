"use client";

import { Share2, Camera } from "lucide-react";
import { useState } from "react";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import type { Player } from "./MatchScoreCard";

type ShareMatchButtonProps = {
	winner: string;
	player1: Player;
	player2: Player;
	totalGamesWon: {
		player1: number;
		player2: number;
	};
	cardRef: React.RefObject<HTMLDivElement>;
	leagueName: string;
	eventName?: string;
	eventDate?: Date;
};

function createShareData(
	winner: string,
	player1: Player,
	player2: Player,
	totalGamesWon: { player1: number; player2: number },
	leagueName: string,
	imageFile?: File,
) {
	const shareData: ShareData = {
		title: `${leagueName} Match Result`,
		text: `${player1.name} - ${totalGamesWon.player1}\n${player2.name} - ${totalGamesWon.player2}\nWinner: ${winner}`,
	};

	// Only include url when sharing link
	if (!imageFile) {
		shareData.url = window.location.href;
	}

	// Only include files when sharing image
	if (imageFile) {
		shareData.files = [imageFile];
	}

	return shareData;
}

function createFileName(
	player1: Player,
	player2: Player,
	eventDate?: Date,
): string {
	const names = `${player1.name}-vs-${player2.name}`;
	const date = eventDate ? format(eventDate, "yyyyMMdd") : "";

	return date ? `${names}-${date}.png` : `${names}.png`;
}

export function ShareMatchButton({
	winner,
	player1,
	player2,
	totalGamesWon,
	cardRef,
	leagueName,
	eventName,
	eventDate,
}: ShareMatchButtonProps) {
	const [isSharing, setIsSharing] = useState(false);

	const handleShareLink = async () => {
		if (!navigator.share) return;

		try {
			await navigator.share(
				createShareData(winner, player1, player2, totalGamesWon, leagueName),
			);
		} catch (error) {
			console.log("Share failed:", error);
		}
	};

	const handleShareImage = async () => {
		if (!navigator.share || !cardRef.current || !navigator.canShare) return;

		setIsSharing(true);
		try {
			const clone = cardRef.current.cloneNode(true) as HTMLElement;
			document.body.appendChild(clone);
			clone.style.position = "absolute";
			clone.style.left = "-9999px";

			const headerDiv = clone.querySelector(".px-4.py-2.bg-gray-50");
			if (!headerDiv) {
				document.body.removeChild(clone);
				setIsSharing(false);
				return;
			}

			const formattedDate = eventDate ? format(eventDate, "dd/MM/yyyy") : "";
			headerDiv.innerHTML = `
				<div class="flex justify-between items-center">
					<div class="flex flex-col">
						<span class="font-semibold">${leagueName}</span>
						${eventName ? `<span>${eventName}</span>` : ""}
					</div>
					${formattedDate ? `<span>${formattedDate}</span>` : ""}
				</div>
			`;

			try {
				const canvas = await html2canvas(clone);
				const blob = await new Promise<Blob>((resolve) => {
					canvas.toBlob((blob) => {
						if (blob) resolve(blob);
					}, "image/png");
				});

				const imageFile = new File(
					[blob],
					createFileName(player1, player2, eventDate),
					{ type: "image/png" },
				);
				const shareData = createShareData(
					winner,
					player1,
					player2,
					totalGamesWon,
					leagueName,
					imageFile,
				);

				if (navigator.canShare(shareData)) {
					await navigator.share(shareData);
				}
			} catch (error) {
				if (error instanceof Error && error.name !== "AbortError") {
					console.log("Share failed:", error);
				}
			} finally {
				document.body.removeChild(clone);
			}
		} catch (error) {
			if (error instanceof Error && error.name !== "AbortError") {
				console.log("Share failed:", error);
			}
		} finally {
			setIsSharing(false);
		}
	};

	return (
		<div className="flex gap-2">
			<button
				type="button"
				onClick={handleShareLink}
				className="p-2 hover:bg-gray-200 rounded-full"
				aria-label="Share match result link"
			>
				<Share2 className="w-5 h-5" />
			</button>
			<button
				type="button"
				onClick={handleShareImage}
				disabled={isSharing}
				className="p-2 hover:bg-gray-200 rounded-full"
				aria-label="Share match result as image"
			>
				{isSharing ? (
					<div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
				) : (
					<Camera className="w-5 h-5" />
				)}
			</button>
		</div>
	);
}
