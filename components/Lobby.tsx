"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ChevronLeft, ChevronRight, Dices, User, Shirt, Smile, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarConfig, TOTAL_SKINS, TOTAL_HAIR_COLORS, TOTAL_HAIR_STYLES, TOTAL_CLOTHING, TOTAL_CLOTH_COLORS, TOTAL_EYES, TOTAL_EYEBROWS, TOTAL_MOUTHS, TOTAL_FACIAL_HAIR, TOTAL_ACCESSORIES } from "./Avatar";


export function Lobby() {
    const router = useRouter();
    const [nickname, setNickname] = useState("");
    const [roomId, setRoomId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Comprehensive Avatar Config
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>({
        skinColor: "0",
        hairColor: "0",
        hairStyle: 0,
        clothing: 0,
        clothingColor: "0",
        eyes: 0,
        eyebrows: 0,
        mouth: 0,
        facialHair: 0,
        accessory: 0
    });

    const randomizeAvatar = () => {
        setAvatarConfig({
            skinColor: Math.floor(Math.random() * TOTAL_SKINS).toString(),
            hairColor: Math.floor(Math.random() * TOTAL_HAIR_COLORS).toString(),
            hairStyle: Math.floor(Math.random() * TOTAL_HAIR_STYLES),
            clothing: Math.floor(Math.random() * TOTAL_CLOTHING),
            clothingColor: Math.floor(Math.random() * TOTAL_CLOTH_COLORS).toString(),
            eyes: Math.floor(Math.random() * TOTAL_EYES),
            eyebrows: Math.floor(Math.random() * TOTAL_EYEBROWS),
            mouth: Math.floor(Math.random() * TOTAL_MOUTHS),
            facialHair: Math.floor(Math.random() * TOTAL_FACIAL_HAIR),
            accessory: Math.floor(Math.random() * TOTAL_ACCESSORIES),
        });
    };

    const updateConfig = (key: keyof AvatarConfig, delta: number, max: number) => {
        setAvatarConfig(prev => {
            const currentVal = Number(prev[key]);
            const nextVal = (currentVal + delta + max) % max;
            // For color properties, store as string, otherwise as number
            if (key === 'skinColor' || key === 'hairColor' || key === 'clothingColor') {
                return { ...prev, [key]: nextVal.toString() };
            }
            return { ...prev, [key]: nextVal };
        });
    };

    const SectionControl = ({ label, configKey, max }: { label: string, configKey: keyof AvatarConfig, max: number }) => (
        <div className="flex items-center justify-between bg-white/5 rounded px-3 py-1.5">
            <span className="text-xs text-white font-bold uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-white" onClick={() => updateConfig(configKey, -1, max)}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-xs font-mono text-white/80 w-4 text-center">{avatarConfig[configKey]}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-white" onClick={() => updateConfig(configKey, 1, max)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
        </div>
    );

    const connectSocket = () => {
        if (!socket.connected) socket.connect();
    };

    const getEffectiveNickname = () => {
        return nickname.trim() || `Guest ${Math.floor(Math.random() * 9000) + 1000}`;
    };

    const handlePlay = () => {
        setIsLoading(true);
        connectSocket();

        const effectiveNickname = getEffectiveNickname();
        const avatarQuery = encodeURIComponent(JSON.stringify(avatarConfig));

        // Use matchmaking
        socket.emit("find-available-room", (response: any) => {
            if (response.success && response.roomId) {
                // Now join/redirect to that room
                // Actually we just redirect, and the page's useEffect will emit 'join-room'
                router.push(`/${response.roomId}?name=${encodeURIComponent(effectiveNickname)}&avatar=${avatarQuery}`);
            } else {
                setIsLoading(false);
                alert("Failed to find a game. Please try again.");
            }
        });
    };

    const handleCreatePrivate = () => {
        setIsLoading(true);
        connectSocket();

        const effectiveNickname = getEffectiveNickname();
        const avatarQuery = encodeURIComponent(JSON.stringify(avatarConfig));

        socket.emit("create-room", { name: effectiveNickname, avatar: avatarConfig, isPrivate: true }, (response: any) => {
            if (response.success && response.roomId) {
                router.push(`/${response.roomId}?name=${encodeURIComponent(effectiveNickname)}&avatar=${avatarQuery}`);
            } else {
                setIsLoading(false);
                alert("Failed to create private room.");
            }
        });
    };

    const handleJoinRoom = () => {
        const code = prompt("Enter Room Code:");
        if (code) {
            setIsLoading(true);
            setRoomId(code);
            connectSocket();

            const effectiveNickname = getEffectiveNickname();
            const avatarQuery = encodeURIComponent(JSON.stringify(avatarConfig));

            // Just redirect, let page handle join
            router.push(`/${code.trim().toUpperCase()}?name=${encodeURIComponent(effectiveNickname)}&avatar=${avatarQuery}`);
        }
    };

    return (
        <div className="w-full max-w-[800px] flex flex-col md:flex-row gap-6 p-4 items-start animate-in zoom-in-95 duration-300">
            {/* Left Column: Avatar Preview */}
            <div className="w-full md:w-[300px] flex flex-col gap-4">
                <div className="bg-[#1a1b4b]/80 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-white/10 flex flex-col items-center relative group">
                    {/* Randomizer */}
                    <div className="absolute top-4 right-4 p-2 bg-white/10 rounded-full cursor-pointer hover:bg-white/20 transition-colors z-10" onClick={randomizeAvatar} title="Randomize">
                        <Dices className="w-5 h-5 text-white/70" />
                    </div>

                    <div className="w-48 h-48 rounded-full border-8 border-white/10 shadow-inner flex items-center justify-center bg-[#E0E0E0] mb-6 overflow-hidden">
                        <Avatar config={avatarConfig} size={190} />
                    </div>

                    <div className="w-full">
                        <Input
                            className="h-12 bg-[#0c0d29]/50 border-none text-white placeholder:text-white/30 font-bold text-center text-lg focus-visible:ring-2 focus-visible:ring-indigo-500 mb-2"
                            placeholder="Enter nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                        />

                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        className="flex-1 z-10 md:w-full h-16 bg-[#54C348] hover:bg-[#46a53b] text-white text-2xl font-black uppercase tracking-wide shadow-[0_4px_0_#38832f] active:shadow-none active:translate-y-1 transition-all rounded-xl"
                        onClick={handlePlay}
                        disabled={isLoading}
                    >
                        PLAY!
                    </Button>
                    <div className="flex gap-3">
                        <Button
                            className="flex-1 z-10 md:w-full h-16 md:h-12 bg-[#367BF0] text-xl hover:bg-[#2860c2] text-white font-bold shadow-[0_4px_0_#234f9e] active:shadow-none active:translate-y-1 transition-all rounded-xl"
                            onClick={handleCreatePrivate}
                            disabled={isLoading}
                        >
                            Create Room
                        </Button>
                        <Button
                            className="flex-1 z-10 md:w-full h-16 md:h-12 bg-[#367BF0] text-xl hover:bg-[#2860c2] text-white font-bold shadow-[0_4px_0_#234f9e] active:shadow-none active:translate-y-1 transition-all rounded-xl"
                            onClick={handleJoinRoom}
                            disabled={isLoading}
                        >
                            Join Room
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Column: Customization Studio */}
            <div className="flex-1 w-full bg-[#1a1b4b]/80 backdrop-blur-md rounded-xl p-3 md:p-6 shadow-2xl border border-white/10 h-[400px] md:h-[443px]">
                <Tabs defaultValue="face" className="w-full h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 bg-[#0c0d29]/50 mb-4 h-16">
                        <TabsTrigger value="face" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-white/70 hover:text-white font-bold px-1 text-[10px] md:text-sm"><Smile className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> Face</TabsTrigger>
                        <TabsTrigger value="hair" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-white/70 hover:text-white font-bold px-1 text-[10px] md:text-sm"><User className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> Hair</TabsTrigger>
                        <TabsTrigger value="style" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-white/70 hover:text-white font-bold px-1 text-[10px] md:text-sm"><Shirt className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> Style</TabsTrigger>
                        <TabsTrigger value="colors" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-white/70 hover:text-white font-bold px-1 text-[10px] md:text-sm"><Palette className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> Colors</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-2">
                        {/* FACE */}
                        <TabsContent value="face" className="space-y-3 mt-0">
                            <SectionControl label="Skin Tone" configKey="skinColor" max={TOTAL_SKINS} />
                            <SectionControl label="Eyes" configKey="eyes" max={TOTAL_EYES} />
                            <SectionControl label="Eyebrows" configKey="eyebrows" max={TOTAL_EYEBROWS} />
                            <SectionControl label="Mouth" configKey="mouth" max={TOTAL_MOUTHS} />
                            <SectionControl label="Facial Hair" configKey="facialHair" max={TOTAL_FACIAL_HAIR} />
                        </TabsContent>

                        {/* HAIR */}
                        <TabsContent value="hair" className="space-y-3 mt-0">
                            <SectionControl label="Hair Style" configKey="hairStyle" max={TOTAL_HAIR_STYLES} />
                            <SectionControl label="Hat / Access." configKey="accessory" max={TOTAL_ACCESSORIES} />
                        </TabsContent>

                        {/* STYLE */}
                        <TabsContent value="style" className="space-y-3 mt-0">
                            <SectionControl label="Clothing Type" configKey="clothing" max={TOTAL_CLOTHING} />
                        </TabsContent>

                        {/* COLORS */}
                        <TabsContent value="colors" className="space-y-3 mt-0">
                            <SectionControl label="Hair Color" configKey="hairColor" max={TOTAL_HAIR_COLORS} />
                            <SectionControl label="Cloth Color" configKey="clothingColor" max={TOTAL_CLOTH_COLORS} />
                            <SectionControl label="Skin Tone" configKey="skinColor" max={TOTAL_SKINS} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
