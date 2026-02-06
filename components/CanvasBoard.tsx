"use client";

import React, { useEffect, useRef, useState, useImperativeHandle } from "react";
import { socket } from "@/lib/socket";
import { AlertTriangle } from "lucide-react";
import Tesseract from 'tesseract.js';

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
}

export const CanvasBoard = React.forwardRef<CanvasBoardRef, CanvasBoardProps>(({ roomId, isDrawer, currentWord, color, lineWidth, tool }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

    const redrawCanvas = (actions: any[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        actions.forEach(action => {
            if (action.type === 'stroke') {
                const { points, color, width } = action;
                if (!points || points.length < 2) return;
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                // Quadratic Curve Smoothing for Redraw
                ctx.moveTo(points[0].x, points[0].y);
                if (points.length > 2) {
                    for (let i = 1; i < points.length - 1; i++) {
                        const midPoint = {
                            x: (points[i].x + points[i + 1].x) / 2,
                            y: (points[i].y + points[i + 1].y) / 2
                        };
                        ctx.quadraticCurveTo(points[i].x, points[i].y, midPoint.x, midPoint.y);
                    }
                    // Connect last point
                    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
                } else {
                    for (let i = 1; i < points.length; i++) {
                        ctx.lineTo(points[i].x, points[i].y);
                    }
                }
                ctx.stroke();
            } else if (action.type === 'fill') {
                // Re-apply fill
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
            // Local Undo
            setHistory(prev => {
                const newHistory = prev.slice(0, -1);
                redrawCanvas(newHistory);
                socket.emit('undo-last-stroke', { roomId }); // Emitting event for sync
                return newHistory;
            });
        }
    }));

    // --- Flood Fill Algorithm ---
    const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) => {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Convert hex fillColor to RGBA
        const hex = fillColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const fillR = r, fillG = g, fillB = b, fillA = 255;

        // Get start color
        const p = (Math.floor(startY) * width + Math.floor(startX)) * 4;
        const startR = data[p], startG = data[p + 1], startB = data[p + 2], startA = data[p + 3];

        if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) return;

        const stack = [[Math.floor(startX), Math.floor(startY)]];

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
            return data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB && data[pos + 3] === startA;
        }

        function colorPixel(pos: number) {
            data[pos] = fillR;
            data[pos + 1] = fillG;
            data[pos + 2] = fillB;
            data[pos + 3] = fillA;
        }
    };
    // ----------------------------

    // Listen for remote Undo/Fill
    useEffect(() => {
        const handleRemoteUndo = () => {
            // Logic for remote undo... without full history sync this is hard.
            // For now, simpler: clear and redraw logic is local only?
            setHistory(prev => {
                const newHistory = prev.slice(0, -1);
                redrawCanvas(newHistory);
                return newHistory;
            });
        };

        const handleRemoteFill = (data: any) => {
            const { x, y, color } = data;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            floodFill(ctx, x, y, color);
            setHistory(prev => [...prev, { type: 'fill', x, y, color }]);
        };

        socket.on('undo-last-stroke', handleRemoteUndo);
        socket.on('fill-canvas', handleRemoteFill);

        return () => {
            socket.off('undo-last-stroke');
            socket.off('fill-canvas');
        };
    }, []);


    // Anti-Cheat: Text Detection
    useEffect(() => {
        if (!isDrawer || !currentWord) return;

        const checkCanvasForText = async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            try {
                const dataUrl = canvas.toDataURL();
                const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng', {
                    logger: m => { } // Silence logs
                });

                const detectedText = text.trim().toUpperCase();
                const targetWord = currentWord.toUpperCase();

                if (detectedText.length > 2 && (detectedText.includes(targetWord) || /^[A-Z\s]{3,}$/.test(detectedText))) {
                    console.log("Potential cheating detected:", detectedText);
                    setWarning("⚠️ No writing letters! Draw only!");
                    setTimeout(() => setWarning(null), 3000);
                }
            } catch (err) {
                console.error("OCR Error:", err);
            }
        };

        const interval = setInterval(checkCanvasForText, 5000);
        return () => clearInterval(interval);
    }, [isDrawer, currentWord]);

    // --- Resize Observer ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        const handleResize = () => {
            const { width, height } = parent.getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                // Redraw history immediately to prevent loss
                // We need to access the LATEST history, so we use the ref or state in a functional update way, 
                // but since this is inside an event listener/observer, we rely on the closure or external ref.
                // Best to expose redrawCanvas as a stable function or use a ref for history.
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            handleResize();
            // We need to trigger a redraw. Since history is state, we might not have latest here if we don't include it in dep array.
            // But ResizeObserver should probably just trigger a re-render or we assume the parent re-renders. 
            // Actually, the simplest way to ensure history is available is to use a Ref for history in addition to state.
        });

        resizeObserver.observe(parent);

        return () => {
            resizeObserver.disconnect();
        };
    }, []); // Empty dep array, but we need to handle history redraw. 

    // Sync History Ref for Resize Redraw
    const historyRef = useRef<any[]>(history);
    useEffect(() => { historyRef.current = history; }, [history]);

    // Effect to redraw when size changes (or just use the observer callback logic if we can access historyRef)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new ResizeObserver(() => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
            }
            redrawCanvas(historyRef.current);
        });
        observer.observe(canvas.parentElement!);
        return () => observer.disconnect();
    }, []);


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Initial Setup
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const handleRemoteStroke = (stroke: any) => {
            const { points, color, width } = stroke;
            if (!points || points.length < 2) return;

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = width;

            // Draw smooth curve for remote strokes too
            ctx.moveTo(points[0].x, points[0].y);

            // Simple lineTo for compatibility or implement smoothing here too. 
            // For true smoothing, we need >2 points. 
            // If points array is full path:
            if (points.length > 2) {
                for (let i = 1; i < points.length - 1; i++) {
                    const midPoint = {
                        x: (points[i].x + points[i + 1].x) / 2,
                        y: (points[i].y + points[i + 1].y) / 2
                    };
                    ctx.quadraticCurveTo(points[i].x, points[i].y, midPoint.x, midPoint.y);
                }
                // Last segment
                ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            } else {
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
            }

            ctx.stroke();

            setHistory(prev => [...prev, { type: 'stroke', points, color, width }]);
        };

        const handleClear = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHistory([]);
            setWarning(null);
        };

        socket.on("draw-stroke", handleRemoteStroke);
        socket.on("clear-canvas", handleClear);

        return () => {
            socket.off("draw-stroke");
            socket.off("clear-canvas");
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

        // Adjust for touch if needed (since touches give screen absolute)
        // offsetX/Y logic handles mouse well. For touch, we need bounding rect subtract.
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
            const action = { type: 'fill', x, y, color };
            setHistory(prev => [...prev, action]);
            socket.emit('fill-canvas', { roomId, ...action });
            return;
        }

        setIsDrawing(true);

        ctx.beginPath();
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = lineWidth;
        ctx.moveTo(x, y); // Start point

        // Initialize points array for this stroke
        (canvas as any).currentStroke = [{ x, y }];
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Update custom cursor
        const { x, y } = getCoordinates(e, canvas);
        setCursorPos({ x, y });

        if (!isDrawing || !isDrawer || tool === 'fill') return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const points = (canvas as any).currentStroke;
        points.push({ x, y });

        if (points.length > 2) {
            const lastPoint = points[points.length - 2];
            const prevPoint = points[points.length - 3];

            // Calculate midpoint for quadratic curve
            const midPoint = {
                x: (lastPoint.x + x) / 2,
                y: (lastPoint.y + y) / 2
            };

            // On screen, we just draw the new segment. 
            // Note: Mixing direct lineTo and quadraticCurveTo dynamically can be tricky for live preview.
            // For live preview "smoothness", we often clear and redraw last segment or just accept slight mismatch until mouseUp.
            // A simple trick: 
            // - Clear rect? No, expensive.
            // - Just allow standard lineTo for live preview, and fix it on redraw? 
            //   - Better: Use quadraticCurveTo from lastMid to newMid.

            const lastMid = (canvas as any).lastMid || prevPoint;

            ctx.beginPath();
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.lineWidth = lineWidth;
            ctx.moveTo(lastPoint.x, lastPoint.y); // This creates small gaps if we don't track start.

            // Actually, best "simple" smooth live draw:
            // Connect lastPoint to current Point but use quadratic control? 

            // Standard approach:
            // Draw from last 2 points.
            ctx.beginPath();
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.lineWidth = lineWidth;
            ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
            ctx.quadraticCurveTo(points[points.length - 2].x, points[points.length - 2].y, x, y);
            // This is actually just a line effectively.

            // Let's stick to simple lineTo for LIVE preview to ensure responsiveness, 
            // but use the history Redraw for the "Smooth" look when it refreshes or other players see it.
            // WAIT - other players see `draw-stroke`. We should emit the full stroke array at the end, 
            // OR emit segments.  Emitting segments is what happens now.

            // Let's try to improve live view slightly:
            ctx.lineTo(x, y);
            ctx.stroke();

        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Emit segment (optimization: emit less frequently?)
        // The current implementation emits every move. That's a lot of socket traffic.
        // Better to emit every ~50ms or throttle. 
        // For now, keep existing logic but ensure we pass enough points if we changed the receiver to do smoothing.
        const lastPoint = points[points.length - 2];
        if (lastPoint) {
            socket.emit("draw-stroke", {
                roomId,
                stroke: {
                    color: tool === 'eraser' ? '#ffffff' : color,
                    width: lineWidth,
                    points: [lastPoint, { x, y }] // Just a segment
                }
            });
        }
    };

    const endDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        // Save full stroke to history
        const canvas = canvasRef.current;
        const points = (canvas as any).currentStroke;
        if (points && points.length > 0) {
            const action = {
                type: 'stroke',
                points: [...points],
                color: tool === 'eraser' ? '#ffffff' : color,
                width: lineWidth
            };
            setHistory(prev => [...prev, action]);
        }
    };

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
});

CanvasBoard.displayName = "CanvasBoard";
