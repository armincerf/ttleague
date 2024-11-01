import { useState, useCallback, useRef, useEffect } from "react";
import type { Point, Area } from "react-easy-crop";
import { getCroppedImg } from "@/lib/canvasUtils";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";
import { useUser } from "@clerk/nextjs";
import { useDropzone } from "react-dropzone";
import { FileIcon, UploadIcon } from "lucide-react";
import { FormControl } from "@/components/ui/form";

function useImageCropper({
	onSave,
	isOpen: isCropperOpen,
	onOpenChange: setIsCropperOpen,
}: {
	onSave: (file: File) => Promise<void>;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { user } = useUser();
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!isCropperOpen) {
			setImageSrc(null);
			setCrop({ x: 0, y: 0 });
			setZoom(1);
			setCroppedAreaPixels(null);
		}
	}, [isCropperOpen]);

	const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
		setCroppedAreaPixels(pixels);
	}, []);

	const handleFileSelection = useCallback(
		(file: File) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				setImageSrc(e.target?.result as string);
				setIsCropperOpen(true);
			};
			reader.readAsDataURL(file);
		},
		[setIsCropperOpen],
	);

	const showCroppedImage = async () => {
		try {
			setIsLoading(true);
			if (user && imageSrc && croppedAreaPixels) {
				const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
				if (croppedImage) {
					const response = await fetch(croppedImage);
					const blob = await response.blob();
					const file = new File([blob], "profile_picture.png", {
						type: "image/png",
					});
					await onSave(file);
					setIsCropperOpen(false);
				}
			}
		} catch (e) {
			console.error(e);
		} finally {
			setIsLoading(false);
		}
	};

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const file = acceptedFiles[0];
			if (file) {
				handleFileSelection(file);
			}
		},
		[handleFileSelection],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { "image/*": [] },
		multiple: false,
	});

	return {
		imageSrc,
		crop,
		zoom,
		setCrop,
		setZoom,
		onCropComplete,
		handleFileSelection,
		showCroppedImage,
		getRootProps,
		getInputProps,
		isDragActive,
		fileInputRef,
		isLoading,
	};
}

export function ImageCropper({
	isOpen: isCropperOpen,
	onOpenChange: setIsCropperOpen,
	onSave,
}: {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (file: File) => Promise<void>;
}) {
	const {
		imageSrc,
		crop,
		zoom,
		setCrop,
		setZoom,
		onCropComplete,
		handleFileSelection,
		showCroppedImage,
		getRootProps,
		getInputProps,
		isDragActive,
		fileInputRef,
		isLoading,
	} = useImageCropper({
		onSave,
		isOpen: isCropperOpen,
		onOpenChange: setIsCropperOpen,
	});

	return (
		<>
			<FormControl>
				<div className="flex items-center space-x-4">
					<div className="flex-1">
						<div className="hidden sm:block">
							<div
								{...getRootProps()}
								className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-gray-300 transition-colors"
							>
								<input {...getInputProps()} />
								<FileIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
								{isDragActive ? (
									<p className="text-sm text-gray-600">Drop the file here</p>
								) : (
									<>
										<p className="text-sm font-medium text-gray-600">
											Drag and drop an image or click to browse
										</p>
										<p className="text-xs text-gray-500 mt-1">
											Supported formats: JPG, PNG, GIF
										</p>
									</>
								)}
							</div>
						</div>
						<div className="sm:hidden">
							<input
								type="file"
								accept="image/*"
								ref={fileInputRef}
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) handleFileSelection(file);
								}}
							/>
							<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={() => fileInputRef.current?.click()}
							>
								<UploadIcon className="w-4 h-4 mr-2" />
								Upload Image
							</Button>
						</div>
					</div>
				</div>
			</FormControl>

			<Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
				<DialogContent className="w-4/5 max-w-[450px]">
					<DialogHeader>
						<DialogTitle>Crop Profile Picture</DialogTitle>
					</DialogHeader>
					<div className="h-[300px] relative">
						{imageSrc && (
							<Cropper
								image={imageSrc}
								crop={crop}
								zoom={zoom}
								aspect={1}
								onCropChange={setCrop}
								onCropComplete={onCropComplete}
								onZoomChange={setZoom}
							/>
						)}
					</div>
					<div className="flex flex-col space-y-2">
						<label htmlFor="zoom-slider">Zoom</label>
						<Slider
							id="zoom-slider"
							min={1}
							max={3}
							step={0.1}
							value={[zoom]}
							onValueChange={(value) => setZoom(value[0])}
						/>
					</div>
					<Button onClick={showCroppedImage} disabled={isLoading}>
						{isLoading ? "Saving..." : "Crop and Save"}
					</Button>
				</DialogContent>
			</Dialog>
		</>
	);
}
