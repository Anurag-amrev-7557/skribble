import React from 'react';
import { motion } from 'framer-motion';

export const GameEndIllustration = () => {
    return (
        <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center mb-4">
            {/* Shining Rays Background */}
            <motion.div
                className="absolute inset-0 z-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
                <svg viewBox="0 0 200 200" className="w-full h-full opacity-20 text-yellow-500 fill-current">
                    {[...Array(12)].map((_, i) => (
                        <path
                            key={i}
                            d={`M 100 100 L ${100 + 120 * Math.cos(i * Math.PI / 6)} ${100 + 120 * Math.sin(i * Math.PI / 6)} L ${100 + 120 * Math.cos(i * Math.PI / 6 + 0.2)} ${100 + 120 * Math.sin(i * Math.PI / 6 + 0.2)} Z`}
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
                    initial={{ scale: 0, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                    }}
                >
                    {/* Cup Body */}
                    <path
                        d="M 20 20 H 80 V 40 C 80 65 65 80 50 80 C 35 80 20 65 20 40 V 20 Z"
                        fill="url(#goldGradient)"
                        stroke="#B45309"
                        strokeWidth="2"
                    />

                    {/* Handles */}
                    <path
                        d="M 20 25 C 10 25 10 50 20 50"
                        stroke="#B45309"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                    />
                    <path
                        d="M 80 25 C 90 25 90 50 80 50"
                        stroke="#B45309"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                    />

                    {/* Stem */}
                    <path
                        d="M 50 80 V 100"
                        stroke="#B45309"
                        strokeWidth="4"
                    />

                    {/* Base */}
                    <path
                        d="M 30 100 H 70 V 110 H 30 Z"
                        fill="#78350F"
                        stroke="#B45309"
                        strokeWidth="2"
                    />

                    {/* Shine */}
                    <motion.path
                        d="M 30 30 L 70 30 L 40 70 Z"
                        fill="white"
                        opacity="0.3"
                        animate={{
                            opacity: [0.1, 0.4, 0.1],
                            x: [-5, 5, -5]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />

                </motion.g>

                <defs>
                    <linearGradient id="goldGradient" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FDE047" />
                        <stop offset="0.5" stopColor="#EAB308" />
                        <stop offset="1" stopColor="#CA8A04" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};
