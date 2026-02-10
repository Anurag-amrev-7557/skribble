import React from 'react';
import { motion } from 'framer-motion';

export const RoundResultIllustration = () => {
    return (
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden mb-2">
            {/* Spotlight Beam */}
            <motion.div
                className="absolute top-0 w-24 h-48 bg-gradient-to-b from-white/20 to-transparent blur-xl origin-top"
                initial={{ rotate: -15, opacity: 0 }}
                animate={{
                    rotate: [-15, 15, -15],
                    opacity: [0, 0.4, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <svg
                viewBox="0 0 300 100"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Text Placeholder / Decoration */}
                <motion.path
                    d="M 50 80 Q 150 100 250 80"
                    stroke="#4ADE80"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                />

                {/* Stars Popping */}
                {[0, 1, 2, 3, 4].map((i) => (
                    <motion.g
                        key={i}
                        initial={{ scale: 0, opacity: 0, x: 150, y: 50 }}
                        animate={{
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                            x: 150 + (Math.random() - 0.5) * 200,
                            y: 50 + (Math.random() - 0.5) * 80
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.4,
                            repeatDelay: 1
                        }}
                    >
                        <path
                            d="M 0 -10 L 2 -3 L 10 -3 L 4 2 L 6 10 L 0 5 L -6 10 L -4 2 L -10 -3 L -2 -3 Z"
                            fill="#FACC15"
                        />
                    </motion.g>
                ))}
            </svg>
        </div>
    );
};
