import React from 'react';
import { motion } from 'framer-motion';

export const WordChoosingIllustration = () => {
    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Background Glow */}
            <motion.div
                className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <svg
                viewBox="0 0 200 200"
                className="w-full h-full drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Orbiting Particles */}
                {[0, 1, 2].map((i) => (
                    <motion.circle
                        key={i}
                        r="3"
                        fill="#A855F7"
                        className="opacity-80"
                        animate={{
                            cx: [100 + 60 * Math.cos(i * 2), 100 + 60 * Math.cos(i * 2 + Math.PI)],
                            cy: [100 + 20 * Math.sin(i * 2), 100 + 20 * Math.sin(i * 2 + Math.PI)],
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 3 + i,
                            repeat: Infinity,
                            ease: "linear",
                            repeatType: "reverse"
                        }}
                    >
                        <animateMotion
                            dur={`${4 + i}s`}
                            repeatCount="indefinite"
                            path={`M 100 100 m -${50 + i * 10}, 0 a ${50 + i * 10},${20 + i * 5} 0 1,0 ${100 + i * 20},0 a ${50 + i * 10},${20 + i * 5} 0 1,0 -${100 + i * 20},0`}
                        />
                    </motion.circle>
                ))}

                {/* Brain Left Hemisphere */}
                <motion.path
                    d="M95 140 C 70 140 50 120 50 90 C 50 60 70 40 95 45"
                    stroke="#E9D5FF"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="url(#brainGradient)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                />

                {/* Brain Right Hemisphere */}
                <motion.path
                    d="M105 140 C 130 140 150 120 150 90 C 150 60 130 40 105 45"
                    stroke="#E9D5FF"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="url(#brainGradient)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
                />

                {/* Synaptic Connections (Squiggles inside) */}
                <motion.path
                    d="M 60 90 Q 70 70 80 90 T 90 70"
                    stroke="#C084FC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    animate={{
                        strokeDasharray: ["0 100", "100 0"],
                        strokeDashoffset: [0, -100]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "mirror"
                    }}
                />
                <motion.path
                    d="M 110 70 Q 120 90 130 70 T 140 90"
                    stroke="#C084FC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    animate={{
                        strokeDasharray: ["0 100", "100 0"],
                        strokeDashoffset: [0, -100]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "mirror",
                        delay: 1
                    }}
                />

                {/* Central Fissure */}
                <motion.path
                    d="M 100 50 L 100 135"
                    stroke="#A855F7"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.5"
                    animate={{ height: [0, 85] }}
                />

                <defs>
                    <linearGradient id="brainGradient" x1="50" y1="0" x2="150" y2="200" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#9333EA" stopOpacity="0.2" />
                        <stop offset="1" stopColor="#A855F7" stopOpacity="0.5" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Thinking Bubbles */}
            <motion.div
                className="absolute top-10 right-10 w-4 h-4 rounded-full bg-yellow-400 blur-[1px]"
                animate={{ y: [-10, 10], opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div
                className="absolute top-20 left-10 w-2 h-2 rounded-full bg-blue-400 blur-[1px]"
                animate={{ y: [-5, 5], opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />

        </div>
    );
};
