"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Eraser, Pencil, Trash2, PaintBucket, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = [
    "#000000", // Black
    "#FFFFFF", // White
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#3b82f6", // Blue
    "#a855f7", // Purple
    "#ec4899", // Pink
    "#71717a", // Gray
    "#78350f", // Brown
    "#0ea5e9", // Sky
    "#10b981", // Emerald
    "#6366f1", // Indigo
];

const PRESET_SIZES = [2, 5, 10, 20, 40];

interface DrawingToolbarProps {
    color: string;
    setColor: (c: string) => void;
    tool: 'pen' | 'eraser' | 'fill';
    setTool: (t: 'pen' | 'eraser' | 'fill') => void;
    lineWidth: number;
    setLineWidth: (w: number) => void;
    onUndo?: () => void;
    onClear: () => void;
    className?: string;
}

export function DrawingToolbar({ color, setColor, tool, setTool, lineWidth, setLineWidth, onUndo, onClear, className }: DrawingToolbarProps) {
    return (
        <div className={cn("flex items-center gap-1 p-1 md:p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur shadow-xl border rounded-2xl md:rounded-full overflow-visible max-w-full justify-between md:justify-center", className)}>

            {/* 1. Color Picker (Leftmost) */}
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-full border-2 border-white/20 shadow-sm transition-transform hover:scale-110 active:scale-95 shrink-0"
                        style={{ backgroundColor: color }}
                        title="Pick Color"
                    />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" side="top" align="start">
                    <div className="grid grid-cols-7 gap-2">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
                                className={cn(
                                    "w-6 h-6 md:w-8 md:h-8 rounded-full border border-black/10 transition-transform hover:scale-110",
                                    color === c && "ring-2 ring-primary ring-offset-2 scale-110"
                                )}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <div className="w-px h-6 md:h-8 bg-black/10 dark:bg-white/10 mx-1" />

            {/* 2. Size Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-full shrink-0 relative">
                        <div
                            className="rounded-full bg-black dark:bg-white transition-all"
                            style={{ width: Math.min(24, Math.max(4, lineWidth)), height: Math.min(24, Math.max(4, lineWidth)) }}
                        />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-12 p-2" side="top">
                    <div className="flex flex-col gap-3 items-center">
                        {PRESET_SIZES.map(size => (
                            <button
                                key={size}
                                onClick={() => setLineWidth(size)}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-black/5 dark:hover:bg-white/10",
                                    lineWidth === size && "bg-black/10 dark:bg-white/10 ring-1 ring-black/20 dark:ring-white/20"
                                )}
                                title={`${size}px`}
                            >
                                <div
                                    className={cn(
                                        "rounded-full bg-black dark:bg-white transition-all",
                                        lineWidth === size ? "scale-100" : "scale-90 opacity-70"
                                    )}
                                    style={{ width: Math.min(24, Math.max(4, size)), height: Math.min(24, Math.max(4, size)) }}
                                />
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <div className="w-px h-6 md:h-8 bg-black/10 dark:bg-white/10 mx-1" />

            {/* 3. Pen Tool */}
            <Button
                variant={tool === 'pen' ? "default" : "ghost"}
                size="icon"
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-full shrink-0"
                onClick={() => setTool('pen')}
                title="Pencil"
            >
                <Pencil className="w-4 h-4 md:w-5 md:h-5" />
            </Button>

            {/* 4. Fill Tool */}
            <Button
                variant={tool === 'fill' ? "default" : "ghost"}
                size="icon"
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-full shrink-0"
                onClick={() => setTool('fill')}
                title="Fill"
            >
                <PaintBucket className="w-4 h-4 md:w-5 md:h-5" />
            </Button>

            {/* 5. Eraser Tool */}
            <Button
                variant={tool === 'eraser' ? "default" : "ghost"}
                size="icon"
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-full shrink-0"
                onClick={() => setTool('eraser')}
                title="Eraser"
            >
                <Eraser className="w-4 h-4 md:w-5 md:h-5" />
            </Button>

            <div className="w-px h-6 md:h-8 bg-black/10 dark:bg-white/10 mx-1" />

            {/* 6. Undo */}
            <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-full shrink-0 hover:bg-black/5"
                onClick={onUndo}
                title="Undo"
                disabled={!onUndo}
            >
                <Undo2 className="w-4 h-4 md:w-5 md:h-5" />
            </Button>

            {/* 7. Delete/Clear */}
            <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-full shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={onClear}
                title="Clear All"
            >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
            </Button>

        </div>
    );
}
