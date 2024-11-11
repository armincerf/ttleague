import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type ImageGalleryProps = {
	images: string[];
};

export function ImageGallery({ images }: ImageGalleryProps) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const isOpen = selectedIndex !== null;

	function handleClose() {
		setSelectedIndex(null);
	}

	function handleNext() {
		setSelectedIndex((current) =>
			current !== null ? (current + 1) % images.length : null,
		);
	}

	function handlePrevious() {
		setSelectedIndex((current) =>
			current !== null ? (current - 1 + images.length) % images.length : null,
		);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "ArrowLeft") {
			handlePrevious();
		} else if (e.key === "ArrowRight") {
			handleNext();
		}
	}

	return (
		<>
			<div className="grid grid-cols-2 gap-2">
				{images.map((src, index) => (
					<button
						key={src}
						type="button"
						className="relative aspect-[4/3] overflow-hidden rounded-lg"
						onClick={() => setSelectedIndex(index)}
						onKeyDown={handleKeyDown}
					>
						<Image
							src={src}
							alt={`Explainer image ${index + 1}`}
							fill
							className="object-cover"
						/>
					</button>
				))}
			</div>

			<Dialog open={isOpen} onOpenChange={handleClose}>
				<DialogContent className="max-w-[90vw] h-[90vh] p-0">
					<VisuallyHidden asChild>
						<DialogTitle>Image Gallery</DialogTitle>
					</VisuallyHidden>

					<div className="relative h-full w-full">
						{selectedIndex !== null && (
							<>
								<div className="absolute inset-0 flex items-center justify-between p-4 z-10">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											handlePrevious();
										}}
										onKeyDown={handleKeyDown}
										className="rounded-full bg-black/50 p-2 text-white/75 hover:text-white transition-colors"
										aria-label="Previous image"
									>
										<ChevronLeft className="h-6 w-6" />
									</button>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											handleNext();
										}}
										onKeyDown={handleKeyDown}
										className="rounded-full bg-black/50 p-2 text-white/75 hover:text-white transition-colors"
										aria-label="Next image"
									>
										<ChevronRight className="h-6 w-6" />
									</button>
								</div>

								<div
									className="relative h-full w-full"
									onClick={handleNext}
									onKeyDown={handleKeyDown}
									onTouchStart={(e) => {
										const touch = e.touches[0];
										const startX = touch.clientX;

										function handleTouchEnd(e: TouchEvent) {
											const touch = e.changedTouches[0];
											const diff = touch.clientX - startX;
											if (Math.abs(diff) > 50) {
												if (diff > 0) {
													handlePrevious();
												} else {
													handleNext();
												}
											}
											document.removeEventListener("touchend", handleTouchEnd);
										}

										document.addEventListener("touchend", handleTouchEnd);
									}}
								>
									<Image
										src={images[selectedIndex]}
										alt={`Explainer image ${selectedIndex + 1}`}
										fill
										className="object-contain"
									/>
								</div>

								<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white/75">
									{selectedIndex + 1} / {images.length}
								</div>
							</>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
