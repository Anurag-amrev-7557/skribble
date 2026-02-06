"use client";

import React from "react";

export type AvatarConfig = {
    skinColor: string;
    hairColor: string;
    hairStyle: number;
    clothing: number;
    clothingColor: string;
    eyes: number;
    eyebrows: number;
    mouth: number;
    facialHair: number;
    accessory: number;
};

// --- PALETTES (Rich Colors) ---
const SKINS = ["#F9C9B6", "#E0B184", "#AE7250", "#8D5524", "#4F2E22", "#FFD700", "#E0E0E0", "#98FB98"];
const HAIR_COLORS = ["#261512", "#5C2F1F", "#A34F23", "#E6BA7E", "#F0E6D2", "#909090", "#1A1A1A", "#FF4040"];
const CLOTH_COLORS = ["#3B3B3B", "#2D4050", "#5D9CEC", "#EC6E6E", "#F2F2F2", "#FFCE54"];

// --- GLOBAL DEFS (Deep Lighting) ---
const GLOBAL_DEFS = (
    <defs>
        {/* Soft Drop Shadow for Depth */}
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feOffset in="blur" dx="0" dy="4" result="offsetBlur" />
            <feComposite in="offsetBlur" in2="SourceAlpha" operator="out" result="shadow" />
            <feComponentTransfer in="shadow" result="shadowAlpha">
                <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
                <feMergeNode in="shadowAlpha" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>

        {/* Inner Glare for Shiny Objects (Eyes, Glasses) */}
        <linearGradient id="glare" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Skin Gradients (Spherical) created dynamically in component */}
    </defs>
);

// --- ASSETS V5 ---

// 1. CLOTHING (Lit)
const CLOTHING = [
    // Hoodie
    (c: string) => <g filter="url(#softShadow)">
        <path d="M40,280 L40,240 C40,200 80,180 140,180 C200,180 240,200 240,240 L240,280 Z" fill={c} />
        {/* Hood Rim */}
        <path d="M90,200 Q140,240 190,200" stroke="rgba(0,0,0,0.15)" strokeWidth="8" fill="none" strokeLinecap="round" />
        {/* Strings */}
        <circle cx="110" cy="240" r="3" fill="#DDD" />
        <circle cx="170" cy="240" r="3" fill="#DDD" />
    </g>,
    // Tee
    (c: string) => <g filter="url(#softShadow)">
        <path d="M40,280 L40,230 C40,200 80,190 140,190 C200,190 240,200 240,230 L240,280 Z" fill={c} />
        <path d="M100,190 Q140,220 180,190" stroke="rgba(0,0,0,0.1)" strokeWidth="4" fill="none" />
    </g>,
    // Suit
    (c: string) => <g filter="url(#softShadow)">
        <path d="M40,280 L40,220 C40,190 80,180 140,180 C200,180 240,190 240,220 L240,280 Z" fill={c} />
        <path d="M140,180 L140,280" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        <path d="M140,180 L100,280 M140,180 L180,280" stroke="rgba(255,255,255,0.1)" strokeWidth="20" />
        <path d="M125,180 L140,230 L155,180" fill="white" /> {/* Shirt */}
        <path d="M140,230 L140,280" stroke="#AA0000" strokeWidth="6" /> {/* Tie */}
    </g>
];

// 2. HEAD BASE (Spherical Gradient)
const HEAD_BASE = (color: string, id: string) => (
    <g filter="url(#softShadow)">
        <defs>
            <radialGradient id={`skinGrad-${id}`} cx="30%" cy="30%" r="80%" fx="30%" fy="30%">
                <stop offset="0%" stopColor={color} stopOpacity="1" /> {/* Highlight */}
                <stop offset="100%" stopColor={color} style={{ stopColor: color, filter: 'brightness(0.7)' }} /> {/* Shadow */}
            </radialGradient>
        </defs>
        {/* Neck */}
        <path d="M100,180 L180,180 L180,220 L100,220 Z" fill={color} style={{ filter: 'brightness(0.8)' }} />
        {/* Head */}
        <rect x="60" y="40" width="160" height="180" rx="70" ry="80" fill={`url(#skinGrad-${id})`} />
        {/* Ear L */}
        <path d="M60,130 C45,120 45,150 60,150" fill={color} />
        {/* Ear R */}
        <path d="M220,130 C235,120 235,150 220,150" fill={color} />
    </g>
);

// 3. EYES (Detailed Retina)
const EYES = [
    // Standard Blue
    <g key="e0">
        <circle cx="105" cy="130" r="14" fill="white" />
        <circle cx="175" cy="130" r="14" fill="white" />
        <circle cx="105" cy="130" r="7" fill="#3B82F6" /> <circle cx="105" cy="130" r="3" fill="black" /> <circle cx="107" cy="128" r="2" fill="white" opacity="0.8" />
        <circle cx="175" cy="130" r="7" fill="#3B82F6" /> <circle cx="175" cy="130" r="3" fill="black" /> <circle cx="177" cy="128" r="2" fill="white" opacity="0.8" />
    </g>,
    // Happy
    <g key="e1">
        <path d="M90,135 Q105,120 120,135" stroke="#333" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M160,135 Q175,120 190,135" stroke="#333" strokeWidth="6" strokeLinecap="round" fill="none" />
    </g>,
    // Winking
    <g key="e2">
        <circle cx="105" cy="130" r="14" fill="white" /> <circle cx="105" cy="130" r="6" fill="#333" />
        <path d="M160,130 Q175,145 190,130" stroke="#333" strokeWidth="5" strokeLinecap="round" fill="none" />
    </g>,
    // Dark/Brown Eyes (Intense)
    <g key="e3">
        <circle cx="105" cy="130" r="12" fill="white" />
        <circle cx="175" cy="130" r="12" fill="white" />
        <circle cx="105" cy="130" r="6.5" fill="#3E2723" /> <circle cx="105" cy="130" r="2.5" fill="black" /> <circle cx="103" cy="128" r="2" fill="white" opacity="0.6" />
        <circle cx="175" cy="130" r="6.5" fill="#3E2723" /> <circle cx="175" cy="130" r="2.5" fill="black" /> <circle cx="173" cy="128" r="2" fill="white" opacity="0.6" />
    </g>,
];

// 4. EYEBROWS
const EYEBROWS = [
    <g key="eb0"><path d="M90,110 Q105,105 120,110" stroke="#4a3b32" strokeWidth="5" strokeLinecap="round" fill="none" /><path d="M160,110 Q175,105 190,110" stroke="#4a3b32" strokeWidth="5" strokeLinecap="round" fill="none" /></g>,
    <g key="eb1"><path d="M90,105 Q105,115 120,115" stroke="#4a3b32" strokeWidth="5" strokeLinecap="round" fill="none" /><path d="M160,115 Q175,115 190,105" stroke="#4a3b32" strokeWidth="5" strokeLinecap="round" fill="none" /></g>,
    <g key="eb2"><path d="M90,100 L120,100" stroke="#4a3b32" strokeWidth="5" strokeLinecap="round" fill="none" /><path d="M160,100 L190,100" stroke="#4a3b32" strokeWidth="5" strokeLinecap="round" fill="none" /></g>,
];

// 5. MOUTHS (Soft shapes)
const MOUTHS = [
    <path key="m0" d="M110,170 Q140,190 170,170" stroke="#3E2723" strokeWidth="5" strokeLinecap="round" fill="none" />, // Smile
    <path key="m1" d="M115,180 L165,180" stroke="#3E2723" strokeWidth="5" strokeLinecap="round" fill="none" />, // Neutral
    <path key="m2" d="M110,170 Q140,210 170,170 Z" fill="white" stroke="#3E2723" strokeWidth="1" />, // Open
    <g key="m3"><path d="M110,170 Q140,190 170,170" stroke="#3E2723" strokeWidth="4" fill="none" /><path d="M130,180 Q140,200 150,180 Z" fill="#FF5252" /></g>, // Tongue
];

// 6. HAIR SYSTEM (3D Gradient Layers)
const HAIR = [
    // Bald
    (c: string) => <g></g>,

    // Short Slick
    (c: string, id: string) => <g filter="url(#softShadow)">
        <defs><linearGradient id={`hair-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} style={{ filter: 'brightness(1.5)' }} /><stop offset="100%" stopColor={c} /></linearGradient></defs>
        <path d="M50,130 C50,40 100,10 140,10 C180,10 230,40 230,130 L230,140 L210,140 L210,110 C210,50 180,40 140,40 C100,40 70,50 70,110 L70,140 L50,140 Z" fill={`url(#hair-${id})`} />
    </g>,

    // Bob
    (c: string, id: string) => <g filter="url(#softShadow)">
        <path d="M50,130 C50,40 100,10 140,10 C180,10 230,40 230,130 V200 C230,220 210,220 210,200 V130 H70 V200 C70,220 50,220 50,200 Z" fill={c} />
        <path d="M50,130 H230" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
    </g>,

    // Afro
    (c: string, id: string) => <g filter="url(#softShadow)">
        <circle cx="140" cy="120" r="90" fill={c} />
        <circle cx="140" cy="120" r="85" fill="url(#glare)" opacity="0.1" /> {/* Shine */}
    </g>,

    // Spiky
    (c: string, id: string) => <g filter="url(#softShadow)">
        <path d="M60,110 L80,60 L110,90 L140,40 L170,90 L200,60 L220,110 Z" fill={c} />
    </g>,

    // Bun
    (c: string, id: string) => <g filter="url(#softShadow)">
        <circle cx="140" cy="50" r="40" fill={c} />
        <path d="M60,110 C60,60 100,40 140,40 C180,40 220,60 220,110 L220,120 H60 Z" fill={c} />
    </g>
];

// 7. FACIAL HAIR
const FACIAL_HAIR = [
    (c: string) => <g></g>,
    (c: string) => <path d="M100,165 Q140,150 180,165 Q180,175 170,175 Q140,160 110,175 Q100,175 100,165 Z" fill={c} />, // Mustache
    (c: string) => <path d="M90,140 L90,180 C90,230 110,250 140,250 C170,250 190,230 190,180 L190,140 L180,140 L180,180 C180,210 170,220 140,220 C110,220 100,210 100,180 L100,140 Z" fill={c} />, // Beard
];

// 8. ACCESSORIES (Modern 3D)
const ACCESSORIES_V3 = [
    <g key="a0"></g>,
    // 3D Glasses
    <g key="a1" filter="url(#softShadow)"><rect x="80" y="115" width="120" height="40" rx="10" fill="#333" opacity="0.8" /><rect x="90" y="120" width="45" height="30" rx="5" fill="#3B82F6" opacity="0.6" /><rect x="145" y="120" width="45" height="30" rx="5" fill="#EF4444" opacity="0.6" /></g>,
    // Gold Shades
    <g key="a2" filter="url(#softShadow)">
        <defs><linearGradient id="goldShades" x1="0" y1="0"><stop offset="0" stopColor="#F59E0B" /><stop offset="1" stopColor="#B45309" /></linearGradient></defs>
        <path d="M80,120 H130 L125,150 Q105,160 85,150 L80,120 Z" fill="url(#goldShades)" stroke="#FCD34D" strokeWidth="2" />
        <path d="M150,120 H200 L195,150 Q175,160 155,150 L150,120 Z" fill="url(#goldShades)" stroke="#FCD34D" strokeWidth="2" />
        <line x1="130" y1="125" x2="150" y2="125" stroke="#FCD34D" strokeWidth="4" />
    </g>,
];


// --- EXPORTS ---
export const TOTAL_SKINS = SKINS.length;
export const TOTAL_HAIR_COLORS = HAIR_COLORS.length;
export const TOTAL_HAIR_STYLES = HAIR.length;
export const TOTAL_CLOTHING = CLOTHING.length;
export const TOTAL_CLOTH_COLORS = CLOTH_COLORS.length;
export const TOTAL_EYES = EYES.length;
export const TOTAL_EYEBROWS = EYEBROWS.length;
export const TOTAL_MOUTHS = MOUTHS.length;
export const TOTAL_FACIAL_HAIR = FACIAL_HAIR.length;
export const TOTAL_ACCESSORIES = ACCESSORIES_V3.length;

export function Avatar({ config, size = 100, className }: { config: AvatarConfig, size?: number, className?: string }) {
    const idx = (val: any, max: number) => Math.abs(Number(val) || 0) % max;
    const skin = SKINS[idx(config.skinColor, TOTAL_SKINS)];
    const hairColor = HAIR_COLORS[idx(config.hairColor, TOTAL_HAIR_COLORS)];
    const clothColor = CLOTH_COLORS[idx(config.clothingColor, TOTAL_CLOTH_COLORS)];

    // Unique ID for gradients
    // Unique ID for gradients
    const uniqueId = React.useId().replace(/:/g, ""); // Remove colons from useId for valid CSS selectors in some browsers
    const uid = uniqueId;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 280 280"
            className={`rounded-full bg-gradient-to-br from-indigo-50 to-white ${className}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {GLOBAL_DEFS}

            {/* 1. CLOTHING (Bottom) */}
            <g transform="translate(0, 10)">
                {CLOTHING[idx(config.clothing, TOTAL_CLOTHING)](clothColor)}
            </g>

            {/* 2. FACE & HEAD */}
            <g transform="translate(0, 0)">
                {HEAD_BASE(skin, uid)}

                {/* Features */}
                {EYES[idx(config.eyes, TOTAL_EYES)]}
                {EYEBROWS[idx(config.eyebrows, TOTAL_EYEBROWS)]}
                {MOUTHS[idx(config.mouth, TOTAL_MOUTHS)]}
                {FACIAL_HAIR[idx(config.facialHair, TOTAL_FACIAL_HAIR)](hairColor)}
            </g>

            {/* 3. HAIR (Top) */}
            {HAIR[idx(config.hairStyle, TOTAL_HAIR_STYLES)](hairColor, uid)}

            {/* 4. ACCESSORIES */}
            {ACCESSORIES_V3[idx(config.accessory, TOTAL_ACCESSORIES)]}
        </svg>
    );
}
