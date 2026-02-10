"use client";
import React, { useEffect, useState } from "react";

interface TransitionProps {
    show: boolean;
    children: React.ReactNode;
    duration?: number;
    className?: string; // Wrapper classes
}

export function Transition({
    show,
    children,
    duration = 300,
    className = "",
}: TransitionProps) {
    const [shouldRender, setShouldRender] = useState(show);
    const [active, setActive] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (show) {
            setShouldRender(true);
            // Double RAF to ensure browser painting
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setActive(true);
                });
            });
        } else {
            setActive(false);
            timeoutId = setTimeout(() => {
                setShouldRender(false);
            }, duration);
        }
        return () => clearTimeout(timeoutId);
    }, [show, duration]);

    if (!shouldRender) return null;

    return (
        <div
            className={`transition-all ease-in-out ${className}`}
            style={{
                transitionDuration: `${duration}ms`,
                opacity: active ? 1 : 0,
                transform: active ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
                pointerEvents: active ? 'auto' : 'none',
            }}
        >
            {children}
        </div>
    );
}
