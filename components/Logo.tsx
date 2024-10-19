import Image from "next/image";

export default function Logo({ className = "" }: { className?: string }) {
	return (
		<div className={`w-full h-24 relative ${className}`}>
			<Image fill src="/mkttl-logo.png" alt="MK Table Tennis Logo" />
		</div>
	);
}
