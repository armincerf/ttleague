import { motion } from "framer-motion";

export function AnimatedTick() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 214 214"
      className="text-green-500 w-16 h-16"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <motion.circle
          fill="currentColor"
          opacity="0.15"
          cx="107"
          cy="107"
          r="72"
          initial={{ r: 0 }}
          animate={{ r: 72 }}
          transition={{
            duration: 0.45,
            ease: [0.66, 0.23, 0.51, 1.23],
          }}
        />
        <motion.circle
          fill="currentColor"
          cx="107"
          cy="107"
          r="72"
          opacity="0.8"
          initial={{ r: 0 }}
          animate={{ r: 72 }}
          transition={{
            duration: 0.5,
            ease: [0.66, 0.23, 0.51, 1.23],
            delay: 0.25,
          }}
        />
        <motion.polyline
          stroke="white"
          strokeWidth="10"
          points="73.5,107.8 93.7,127.9 142.2,79.4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 0.5,
            ease: [0.55, 0.2, 0.71, -0.04],
            delay: 0.7,
          }}
        />
      </g>
    </svg>
  );
} 