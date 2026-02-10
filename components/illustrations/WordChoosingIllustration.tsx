import React from 'react';
import { motion } from 'framer-motion';

export const WordChoosingIllustration = () => {
    return (
        <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center">
            {/* Background Glow */}
            <motion.div
                className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <svg
                viewBox="0 0 200 200"
                className="w-full h-full drop-shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Pencil Body */}
                <motion.g
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {/* Pencil shaft */}
                    <rect x="82" y="50" width="36" height="80" rx="4" fill="url(#pencilGrad)" />
                    {/* Pencil band */}
                    <rect x="82" y="118" width="36" height="12" rx="2" fill="#312E81" />
                    {/* Eraser */}
                    <rect x="85" y="130" width="30" height="14" rx="4" fill="#818CF8" opacity="0.6" />
                    {/* Tip */}
                    <path d="M82 50 L100 28 L118 50 Z" fill="#FDE68A" />
                    <path d="M95 50 L100 35 L105 50 Z" fill="#1E1B4B" />
                </motion.g>

                {/* Sparkles around the pencil tip */}
                {[
                    { cx: 70, cy: 35, delay: 0 },
                    { cx: 130, cy: 40, delay: 0.6 },
                    { cx: 60, cy: 60, delay: 1.2 },
                    { cx: 140, cy: 55, delay: 0.3 },
                    { cx: 100, cy: 20, delay: 0.9 },
                ].map((s, i) => (
                    <motion.g
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: s.delay,
                            repeatDelay: 0.5,
                        }}
                    >
                        <circle cx={s.cx} cy={s.cy} r="3" fill="#A5B4FC" />
                        <line x1={s.cx - 6} y1={s.cy} x2={s.cx + 6} y2={s.cy} stroke="#C7D2FE" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1={s.cx} y1={s.cy - 6} x2={s.cx} y2={s.cy + 6} stroke="#C7D2FE" strokeWidth="1.5" strokeLinecap="round" />
                    </motion.g>
                ))}

                {/* Writing line animation */}
                <motion.path
                    d="M 60 170 Q 80 155 100 170 T 140 170"
                    stroke="#6366F1"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                />

                <defs>
                    <linearGradient id="pencilGrad" x1="82" y1="50" x2="118" y2="130" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6366F1" />
                        <stop offset="1" stopColor="#4338CA" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};
