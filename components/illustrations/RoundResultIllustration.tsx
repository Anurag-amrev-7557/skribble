import React from 'react';
import { motion } from 'framer-motion';

export const RoundResultIllustration = () => {
    return (
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden mb-2">
            {/* Subtle spotlight */}
            <motion.div
                className="absolute top-0 w-20 h-40 bg-gradient-to-b from-indigo-400/20 to-transparent blur-xl origin-top"
                animate={{
                    rotate: [-10, 10, -10],
                    opacity: [0, 0.3, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <svg
                viewBox="0 0 300 90"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Animated checkmark in circle */}
                <motion.circle
                    cx="150"
                    cy="45"
                    r="28"
                    stroke="#6366F1"
                    strokeWidth="3"
                    fill="#6366F1"
                    fillOpacity="0.15"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                />
                <motion.path
                    d="M 137 45 L 146 54 L 163 37"
                    stroke="#A5B4FC"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                />

                {/* Confetti dots bursting outward */}
                {[
                    { x: -40, y: -25, color: "#818CF8", delay: 0.4 },
                    { x: 40, y: -20, color: "#A5B4FC", delay: 0.5 },
                    { x: -30, y: 25, color: "#C7D2FE", delay: 0.6 },
                    { x: 35, y: 30, color: "#6366F1", delay: 0.45 },
                    { x: -50, y: 0, color: "#E0E7FF", delay: 0.55 },
                    { x: 50, y: -5, color: "#818CF8", delay: 0.65 },
                ].map((dot, i) => (
                    <motion.circle
                        key={i}
                        cx={150}
                        cy={45}
                        r="3"
                        fill={dot.color}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                        animate={{
                            x: dot.x,
                            y: dot.y,
                            opacity: [0, 1, 0],
                            scale: [0, 1.2, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            delay: dot.delay,
                            repeat: Infinity,
                            repeatDelay: 2,
                        }}
                    />
                ))}

                {/* Decorative curved line */}
                <motion.path
                    d="M 50 75 Q 150 90 250 75"
                    stroke="#6366F1"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                />
            </svg>
        </div>
    );
};
