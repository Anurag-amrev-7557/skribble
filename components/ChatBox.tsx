
"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "@/lib/socket";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatBoxProps {
    roomId: string;
    playerName: string;
}

export function ChatBox({ roomId, playerName }: ChatBoxProps) {
    const [messages, setMessages] = useState<Array<{ sender: string; text: string; type?: 'system' | 'chat' | 'guess' }>>([]);
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMessage = (msg: any) => {
            console.log("ChatBox received:", msg);
            setMessages((prev) => [...prev, msg]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        };

        socket.on("chat-message", handleMessage);

        return () => {
            socket.off("chat-message");
        };
    }, []);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Emit message
        // If it's a guess, backend should handle checking vs current word
        // For now, simple chat
        socket.emit("chat-message", { roomId, text: input });

        // Optimistic update?
        // setMessages((prev) => [...prev, { sender: playerName, text: input, type: "chat" }]);

        setInput("");
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                <div className="space-y-2 flex flex-col min-h-0">
                    {messages.map((msg, i) => {
                        const isSuccess = msg.type === 'system' && msg.text.includes("guessed the word!");
                        return (
                            <div key={i} className={`text-[12px] mb-0 p-1 ${isSuccess
                                ? (i % 2 === 0 ? 'bg-green-200 dark:bg-green-800/40 text-green-800 dark:text-green-100' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-100')
                                : (i % 2 === 0 ? 'bg-muted' : 'bg-transparent') + (msg.type === 'system' ? '' : '')
                                }`}>
                                {msg.type !== 'system' && <span className="font-bold text-foreground/80">{msg.sender}: </span>}
                                {msg.type === 'system' ? (
                                    <span className={`font-bold ${msg.text.includes("joined") ? "text-green-600 dark:text-green-400" :
                                        msg.text.includes("left") ? "text-amber-600 dark:text-amber-400" :
                                            msg.text.includes("guessed") ? "text-green-600 dark:text-green-400" :
                                                "text-blue-500"
                                        }`}>
                                        {msg.text}
                                    </span>
                                ) : (
                                    <span className={msg.type === 'guess' ? 'text-green-600 font-bold' : 'text-foreground/90'}>
                                        {msg.text}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t bg-background hidden md:block">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your guess here..."
                    className="bg-muted/50"
                />
            </form>
        </div>
    );
}
