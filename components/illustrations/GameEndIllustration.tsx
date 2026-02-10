import React from 'react';
import { motion } from 'framer-motion';

export const GameEndIllustration = () => {
    return (
        <div className="relative w-32 h-32 md:w-44 md:h-44 flex items-center justify-center mb-4">
            {/* Shining rays */}
            <motion.div
                className="absolute inset-0 z-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            >
                <svg viewBox="0 0 200 200" className="w-full h-full opacity-15 text-indigo-400 fill-current">
                    {[...Array(12)].map((_, i) => (
                        <path
                            key={i}
                            d={`M 100 100 L ${100 + 110 * Math.cos(i * Math.PI / 6)} ${100 + 110 * Math.sin(i * Math.PI / 6)} L ${100 + 110 * Math.cos(i * Math.PI / 6 + 0.18)} ${100 + 110 * Math.sin(i * Math.PI / 6 + 0.18)} Z`}
                        />
                    ))}
                </svg>
            </motion.div>

            {/* Trophy */}
            <svg
                viewBox="0 0 100 120"
                className="w-full h-full z-10 drop-shadow-2xl"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <motion.g
                    initial={{ scale: 0, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 18,
                    }}
                >
                    {/* Cup body */}
                    <path
                        d="M 22 22 H 78 V 42 C 78 64 64 78 50 78 C 36 78 22 64 22 42 V 22 Z"
                        fill="url(#trophyGrad)"
                        stroke="#312E81"
                        strokeWidth="2"
                    />

                    {/* Handles */}
                    <path
                        d="M 22 27 C 12 27 12 50 22 50"
                        stroke="#312E81"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                    />
                    <path
                        d="M 78 27 C 88 27 88 50 78 50"
                        stroke="#312E81"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                    />

                    {/* Star on cup */}
                    <motion.path
                        d="M 50 35 L 53 44 L 62 44 L 55 50 L 57 59 L 50 54 L 43 59 L 45 50 L 38 44 L 47 44 Z"
                        fill="#E0E7FF"
                        opacity="0.8"
                        animate={{ opacity: [0.4, 0.9, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* Stem */}
                    <path d="M 50 78 V 98" stroke="#312E81" strokeWidth="3.5" />

                    {/* Base */}
                    <path
                        d="M 32 98 H 68 V 108 H 32 Z"
                        fill="#4338CA"
                        stroke="#312E81"
                        strokeWidth="2"
                        rx="2"
                    />

                    {/* Shine */}
                    <motion.path
                        d="M 32 30 L 68 30 L 42 65 Z"
                        fill="white"
                        opacity="0.2"
                        animate={{
                            opacity: [0.05, 0.25, 0.05],
                            x: [-3, 3, -3],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                </motion.g>

                <defs>
                    <linearGradient id="trophyGrad" x1="22" y1="22" x2="78" y2="78" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#818CF8" />
                        <stop offset="0.5" stopColor="#6366F1" />
                        <stop offset="1" stopColor="#4338CA" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};
