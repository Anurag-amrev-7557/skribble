
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider"; // If available, otherwise standard input
import { Swords, Clock, Hash, Type, User } from "lucide-react";

interface RoomSettingsProps {
    settings: any;
    isHost: boolean;
    onUpdate: (settings: any) => void;
    onStart: () => void;
    onInvite: () => void;
}

export function RoomSettings({ settings, isHost, onUpdate, onStart, onInvite }: RoomSettingsProps) {
    const handleChange = (key: string, value: any) => {
        if (!isHost) return;
        onUpdate({ [key]: value });
    };

    return (
        <div className="w-full h-full flex flex-col justify-between animate-in fade-in zoom-in-95 duration-300 m-0">
            <div className="w-full h-full overflow-hidden flex flex-col m-0">

                <div className="p-1 flex-1 overflow-y-auto m-0 flex flex-col">
                    <div className="grid grid-cols-2 gap-2 md:gap-6 mb-2">
                        {/* LEFT COLUMN: Players, Draw Time, Rounds */}
                        <div className="space-y-2 md:space-y-6">
                            <div className="space-y-1 md:space-y-2">
                                <Label className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <User className="w-3 h-3 md:w-4 md:h-4" /> Max Players
                                </Label>
                                <Select disabled={!isHost} value={String(settings.maxPlayers || 8)} onValueChange={(v) => handleChange('maxPlayers', Number(v))}>
                                    <SelectTrigger className="font-semibold h-8 md:h-10 text-xs md:text-sm">
                                        <SelectValue placeholder="8" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2, 3, 4, 5, 6, 7, 8, 10, 12].map(num => (
                                            <SelectItem key={num} value={String(num)} className="font-semibold">{num} Players</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 md:space-y-2">
                                <Label className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <Clock className="w-3 h-3 md:w-4 md:h-4" /> Draw Time
                                </Label>
                                <Select disabled={!isHost} value={String(settings.roundTime || 60)} onValueChange={(v) => handleChange('roundTime', Number(v))}>
                                    <SelectTrigger className="font-semibold h-8 md:h-10 text-xs md:text-sm">
                                        <SelectValue placeholder="60s" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[30, 45, 60, 80, 100, 120, 180].map(num => (
                                            <SelectItem key={num} value={String(num)} className="font-semibold">{num} Seconds</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 md:space-y-2">
                                <Label className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <Hash className="w-3 h-3 md:w-4 md:h-4" /> Rounds
                                </Label>
                                <Select disabled={!isHost} value={String(settings.totalRounds || 3)} onValueChange={(v) => handleChange('totalRounds', Number(v))}>
                                    <SelectTrigger className="font-semibold h-8 md:h-10 text-xs md:text-sm">
                                        <SelectValue placeholder="3" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6, 8, 10].map(num => (
                                            <SelectItem key={num} value={String(num)} className="font-semibold">{num} Rounds</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Word Choices, Game Mode, Hints */}
                        <div className="space-y-2 md:space-y-6">
                            <div className="space-y-1 md:space-y-2">
                                <Label className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <Type className="w-3 h-3 md:w-4 md:h-4" /> Word Choices
                                </Label>
                                <Select disabled={!isHost} value={String(settings.wordCount || 3)} onValueChange={(v) => handleChange('wordCount', Number(v))}>
                                    <SelectTrigger className="font-semibold h-8 md:h-10 text-xs md:text-sm">
                                        <SelectValue placeholder="3" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <SelectItem key={num} value={String(num)} className="font-semibold">{num} Words</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 md:space-y-2">
                                <Label className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Game Mode
                                </Label>
                                <Select disabled={!isHost} value={String(settings.gameMode || 'NORMAL')} onValueChange={(v) => handleChange('gameMode', v)}>
                                    <SelectTrigger className="font-semibold h-8 md:h-10 text-xs md:text-sm">
                                        <SelectValue placeholder="NORMAL" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NORMAL" className="font-semibold">NORMAL</SelectItem>
                                        <SelectItem value="HIDDEN" className="font-semibold">HIDDEN</SelectItem>
                                        <SelectItem value="COMBINATION" className="font-semibold">COMBINATION</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 md:space-y-2">
                                <Label className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Hints
                                </Label>
                                <Select disabled={!isHost} value={settings.hints === false ? "false" : "true"} onValueChange={(v) => handleChange('hints', v === "true")}>
                                    <SelectTrigger className="font-semibold h-8 md:h-10 text-xs md:text-sm">
                                        <SelectValue placeholder="Enabled" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true" className="font-semibold">Enabled</SelectItem>
                                        <SelectItem value="false" className="font-semibold">Disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Custom Words - Full Width Below */}
                    <div className={`space-y-2 bg-muted/30 ${settings.useCustomWords ? 'flex-1 flex flex-col min-h-0' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="font-semibold text-xs">Custom Words</Label>
                            <input
                                type="checkbox"
                                className="toggle scale-125 mr-2"
                                checked={settings.useCustomWords || false}
                                onChange={(e) => handleChange('useCustomWords', e.target.checked)}
                                disabled={!isHost}
                            />
                        </div>
                        {settings.useCustomWords && (
                            <textarea
                                className="w-full flex-1 p-3 rounded-lg bg-background border border-input text-sm font-mono focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                placeholder="Enter custom words, separated by commas (e.g. apple, banana, car)"
                                value={settings.customWords?.join(', ') || ''}
                                onChange={(e) => handleChange('customWords', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                                disabled={!isHost}
                            />
                        )}
                    </div>
                </div>

                <div className="border-t border-border bg-muted/20 flex items-center justify-between">
                    {isHost ? (
                        <Button
                            size="lg"
                            onClick={onStart}
                            className="flex-[2] rounded-[0px] m-0 p-0 font-black text-lg bg-green-500 hover:bg-green-600 text-white shadow-[0_4px_0_#15803d] active:shadow-none active:translate-y-1 transition-all"
                        >
                            START GAME
                        </Button>
                    ) : (
                        <div className="flex-[2] rounded-[0px] m-0 p-0 text-center font-semibold text-muted-foreground animate-pulse">
                            Waiting for host to start...
                        </div>
                    )}
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onInvite}
                        className="flex-1 rounded-[0px] m-0 p-0 font-semibold border-1"
                    >
                        Invite Friends
                    </Button>

                </div>
            </div>
        </div>
    );
}
