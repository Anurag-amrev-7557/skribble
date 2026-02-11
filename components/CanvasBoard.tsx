
"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, useCallback } from "react";
import { socket } from "@/lib/socket";
import { AlertTriangle } from "lucide-react";
import Tesseract from 'tesseract.js';
import throttle from 'lodash.throttle';
import { DrawAction, Stroke } from "@/shared/socket-events";

export interface CanvasBoardRef {
    clear: () => void;
    undo: () => void;
}

interface CanvasBoardProps {
    roomId: string;
    isDrawer: boolean;
    currentWord?: string | null;
    color: string;
    lineWidth: number;
    tool: 'pen' | 'eraser' | 'fill';
    initialHistory?: DrawAction[]; // New prop for history sync
}

export const CanvasBoard = React.memo(React.forwardRef<CanvasBoardRef, CanvasBoardProps>(({ roomId, isDrawer, currentWord, color, lineWidth, tool, initialHistory }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);
    const [history, setHistory] = useState<DrawAction[]>(initialHistory || []);
    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);
    const historyRef = useRef<DrawAction[]>(history);

    // Sync history ref
    useEffect(() => {
        historyRef.current = history;
    }, [history]);

    // Apply initial history when it changes (e.g. on rejoin)
    useEffect(() => {
        if (initialHistory && initialHistory.length > 0) {
            setHistory(initialHistory);
            setTimeout(() => {
                // Redraw immediately after history update
                if (historyRef.current) redrawCanvas(historyRef.current);
            }, 0);
        }
    }, [initialHistory]);


    // Buffered Socket Emitter
    const pendingPoints = useRef<{ x: number, y: number }[]>([]);
    const strokeConfig = useRef({ color: '#000000', width: 5, tool: 'pen' });

    // Update config refs
    useEffect(() => {
        strokeConfig.current = { color, width: lineWidth, tool };
    }, [color, lineWidth, tool]);

    const flushBuffer = useCallback(
        throttle(() => {
            const points = pendingPoints.current;
            if (points.length < 2) return;

            const { color, width, tool } = strokeConfig.current;

            socket.emit("draw-stroke", {
                roomId,
                stroke: {
                    color: tool === 'eraser' ? '#ffffff' : color,
                    width,
                    points: [...points]
                }
            });

            // Keep the last point as the start of the next segment to ensure continuity
            pendingPoints.current = [points[points.length - 1]];
        }, 32, { leading: false, trailing: true }), // 30fps
        [roomId]
    );

    const redrawCanvas = (actions: DrawAction[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        actions.forEach(action => {
            if (action.type === 'stroke') {
                const { points, color, width } = action;
                if (!points || points.length < 2) return;
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = width;

                // Quadratic Curve Smoothing
                ctx.moveTo(points[0].x, points[0].y);
                if (points.length > 2) {
                    for (let i = 1; i < points.length - 1; i++) {
                        const midPoint = {
                            x: (points[i].x + points[i + 1].x) / 2,
                            y: (points[i].y + points[i + 1].y) / 2
                        };
                        ctx.quadraticCurveTo(points[i].x, points[i].y, midPoint.x, midPoint.y);
                    }
                    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
                } else {
                    for (let i = 1; i < points.length; i++) {
                        ctx.lineTo(points[i].x, points[i].y);
                    }
                }
                ctx.stroke();
            } else if (action.type === 'fill') {
                const { x, y, color } = action;
                floodFill(ctx, x, y, color);
            }
        });
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        clear: () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHistory([]);
            socket.emit('clear-canvas', { roomId });
        },
        undo: () => {
            setHistory(prev => {
                const newHistory = prev.slice(0, -1);
                redrawCanvas(newHistory);
                socket.emit('undo-last-stroke', { roomId });
                return newHistory;
            });
        }
    }));

    // Keyboard Shortcuts (Z for Undo)
    useEffect(() => {
        if (!isDrawer) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const key = e.key.toLowerCase();
            if ((e.metaKey || e.ctrlKey) && key === 'z') {
                e.preventDefault();
                setHistory(prev => {
                    const newHistory = prev.slice(0, -1);
                    redrawCanvas(newHistory);
                    socket.emit('undo-last-stroke', { roomId });
                    return newHistory;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDrawer, roomId]);


    // --- Flood Fill Algorithm ---
    const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) => {
        const dpr = window.devicePixelRatio || 1;
        const physicalX = Math.floor(startX * dpr);
        const physicalY = Math.floor(startY * dpr);

        const canvas = ctx.canvas;
        const width = canvas.width;  // This is physical width (CSS width * DPR)
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const hex = fillColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const fillR = r, fillG = g, fillB = b, fillA = 255;

        const p = (physicalY * width + physicalX) * 4;
        const startR = data[p], startG = data[p + 1], startB = data[p + 2], startA = data[p + 3];

        if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) return;

        const stack = [[physicalX, physicalY]];

        while (stack.length) {
            let [x, y] = stack.pop()!;
            let pixelPos = (y * width + x) * 4;

            while (y >= 0 && matchStartColor(pixelPos)) {
                y--;
                pixelPos -= width * 4;
            }
            pixelPos += width * 4;
            y++;

            let reachLeft = false;
            let reachRight = false;

            while (y < height && matchStartColor(pixelPos)) {
                colorPixel(pixelPos);

                if (x > 0) {
                    if (matchStartColor(pixelPos - 4)) {
                        if (!reachLeft) {
                            stack.push([x - 1, y]);
                            reachLeft = true;
                        }
                    } else if (reachLeft) {
                        reachLeft = false;
                    }
                }

                if (x < width - 1) {
                    if (matchStartColor(pixelPos + 4)) {
                        if (!reachRight) {
                            stack.push([x + 1, y]);
                            reachRight = true;
                        }
                    } else if (reachRight) {
                        reachRight = false;
                    }
                }

                y++;
                pixelPos += width * 4;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        function matchStartColor(pos: number) {
            const r = data[pos];
            const g = data[pos + 1];
            const b = data[pos + 2];
            const a = data[pos + 3];

            // Exact match for start color (robust enough for digital lines usually, but fuzzy if anti-aliased)
            // If we want tolerance, we can add it here.
            // For now, let's stick to exact match to prevent over-filling, or maybe small tolerance?
            // Existing code was exact match.
            // The issue reported was "fills whole background". That was likely coordinate mismatch.
            // If the user clicks inside a circle but the coord is mapped to outside (background),
            // then it floods background.
            // So coordinate fix is the primary one.
            // Let's stick to exact match for now unless requested.
            return r === startR && g === startG && b === startB && a === startA;
        }

        function colorPixel(pos: number) {
            data[pos] = fillR;
            data[pos + 1] = fillG;
            data[pos + 2] = fillB;
            data[pos + 3] = fillA;
        }
    };

    // Listen for remote events
    useEffect(() => {
        const handleRemoteStroke = (stroke: Stroke) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const { points, color, width } = stroke;

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.moveTo(points[0].x, points[0].y);

            if (points.length > 2) {
                for (let i = 1; i < points.length - 1; i++) {
                    const midPoint = {
                        x: (points[i].x + points[i + 1].x) / 2,
                        y: (points[i].y + points[i + 1].y) / 2
                    };
                    ctx.quadraticCurveTo(points[i].x, points[i].y, midPoint.x, midPoint.y);
                }
                ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            } else {
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
            }
            ctx.stroke();

            setHistory(prev => [...prev, { type: 'stroke', points, color, width }]);
        };

        const handleRemoteUndo = () => {
            setHistory(prev => {
                const newHistory = prev.slice(0, -1);
                redrawCanvas(newHistory);
                return newHistory;
            });
        };

        const handleRemoteFill = (data: { x: number, y: number, color: string }) => {
            const { x, y, color } = data;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            floodFill(ctx, x, y, color);
            setHistory(prev => [...prev, { type: 'fill', x, y, color }]);
        };

        const handleClear = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHistory([]);
            setWarning(null);
        }

        socket.on("draw-stroke", handleRemoteStroke);
        socket.on('undo-last-stroke', handleRemoteUndo);
        socket.on('fill-canvas', handleRemoteFill);
        socket.on('clear-canvas', handleClear);

        return () => {
            socket.off("draw-stroke");
            socket.off('undo-last-stroke');
            socket.off('fill-canvas');
            socket.off('clear-canvas');
        };
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).nativeEvent.offsetX;
            clientY = (e as React.MouseEvent).nativeEvent.offsetY;
        }

        if ('touches' in e) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }
        return { x: clientX, y: clientY };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawer) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { x, y } = getCoordinates(e, canvas);

        if (tool === 'fill') {
            floodFill(ctx, x, y, color);
            const action: DrawAction = { type: 'fill', x, y, color };
            setHistory(prev => [...prev, action]);
            socket.emit('fill-canvas', { roomId, ...action });
            return;
        }

        setIsDrawing(true);
        ctx.beginPath();
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(x, y);

        (canvas as any).currentStroke = [{ x, y }];
        pendingPoints.current = [{ x, y }];
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const { x, y } = getCoordinates(e, canvas);
        setCursorPos({ x, y });

        if (!isDrawing || !isDrawer || tool === 'fill') return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const points = (canvas as any).currentStroke;
        points.push({ x, y });
        pendingPoints.current.push({ x, y });
        flushBuffer();

        if (points.length > 2) {
            const p1 = points[points.length - 3];
            const p2 = points[points.length - 2];
            const p3 = points[points.length - 1];

            const mid1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            const mid2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

            ctx.beginPath();
            ctx.moveTo(mid1.x, mid1.y);
            ctx.quadraticCurveTo(p2.x, p2.y, mid2.x, mid2.y);
            ctx.stroke();
        }
    };

    const endDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const points = (canvas as any).currentStroke;

        if (points && points.length > 0) {
            const action: DrawAction = {
                type: 'stroke',
                points: [...points],
                color: tool === 'eraser' ? '#ffffff' : color,
                width: lineWidth
            };
            setHistory(prev => [...prev, action]);
        }

        flushBuffer.flush();
        pendingPoints.current = [];
    };

    // Anti-Cheat: Text Detection
    useEffect(() => {
        if (!isDrawer || !currentWord) return;

        const checkCanvasForText = async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            try {
                const dataUrl = canvas.toDataURL();
                // Simple optimization: only check if enough strokes?
                if (historyRef.current.length < 5) return;

                const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng', {
                    logger: m => { }
                });

                const detectedText = text.trim().toUpperCase();
                const targetWord = currentWord.toUpperCase();

                if (detectedText.length > 2 && (detectedText.includes(targetWord) || /^[A-Z\s]{3,}$/.test(detectedText))) {
                    console.log("Potential cheating detected:", detectedText);
                    setWarning("⚠️ No writing letters! Draw only!");
                    setTimeout(() => setWarning(null), 3000);
                }
            } catch (err) {
                // Ignore
            }
        };

        const interval = setInterval(checkCanvasForText, 5000);
        return () => clearInterval(interval);
    }, [isDrawer, currentWord]);

    // --- Resize Observer (High DPI Support) ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        const handleResize = () => {
            const { width, height } = parent.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.scale(dpr, dpr);
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
            }
            // Redraw history after resize
            setTimeout(() => {
                if (historyRef.current) redrawCanvas(historyRef.current);
            }, 0);
        };

        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });

        resizeObserver.observe(parent);
        handleResize();

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div className="relative w-full h-full group touch-none select-none">
            <canvas
                ref={canvasRef}
                className={`w-full h-full touch-none ${isDrawer ? "cursor-none" : "cursor-default"}`}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={(e) => { endDrawing(); setCursorPos(null); }}
                onMouseEnter={(e) => {
                    const { x, y } = getCoordinates(e, canvasRef.current!);
                    setCursorPos({ x, y });
                }}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
            />

            {/* Custom Cursor */}
            {isDrawer && cursorPos && (
                <div
                    className="pointer-events-none absolute rounded-full border border-black/50 bg-current opacity-50 z-50 transform -translate-x-1/2 -translate-y-1/2 shadow-sm"
                    style={{
                        left: cursorPos.x,
                        top: cursorPos.y,
                        width: Math.max(lineWidth, 8),
                        height: Math.max(lineWidth, 8),
                        color: tool === 'eraser' ? 'white' : color,
                        backgroundColor: tool === 'eraser' ? 'white' : color,
                        boxShadow: '0 0 2px rgba(0,0,0,0.5), inset 0 0 2px rgba(0,0,0,0.5)'
                    }}
                />
            )}

            {/* Cheat Warning */}
            {warning && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-2 rounded-full font-bold shadow-lg animate-bounce flex items-center gap-2 z-40">
                    <AlertTriangle className="w-5 h-5" />
                    {warning}
                </div>
            )}
        </div>
    );
}));

CanvasBoard.displayName = "CanvasBoard";
