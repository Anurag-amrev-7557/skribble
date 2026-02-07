import { useCallback, useEffect, useRef } from 'react';

type SoundType = 'chat' | 'join' | 'leave' | 'guess-correct' | 'turn-start' | 'game-end' | 'tick';

export function useGameSounds() {
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        // Initialize AudioContext on first user interaction if possible, 
        // or just lazy load it. Browsers block AudioContext until interaction.
        const initAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
        };

        window.addEventListener('click', initAudio, { once: true });
        window.addEventListener('keydown', initAudio, { once: true });

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0) => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.1, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
    };

    const playSound = useCallback((type: SoundType) => {
        if (!audioContextRef.current) return;

        switch (type) {
            case 'chat':
                // High blip
                playTone(800, 'sine', 0.1);
                break;
            case 'join':
                // Rising chime
                playTone(400, 'sine', 0.1, 0);
                playTone(600, 'sine', 0.2, 0.1);
                break;
            case 'leave':
                // Falling chime
                playTone(600, 'sine', 0.1, 0);
                playTone(400, 'sine', 0.2, 0.1);
                break;
            case 'guess-correct':
                // Victory trill (Retro style)
                playTone(523.25, 'square', 0.1, 0); // C5
                playTone(659.25, 'square', 0.1, 0.1); // E5
                playTone(783.99, 'square', 0.2, 0.2); // G5
                playTone(1046.50, 'square', 0.4, 0.3); // C6
                break;
            case 'turn-start':
                // Attention grabber
                playTone(300, 'triangle', 0.1, 0);
                playTone(300, 'triangle', 0.1, 0.15);
                break;
            case 'game-end':
                // Long chord
                playTone(261.63, 'sawtooth', 1.0, 0);
                playTone(329.63, 'sawtooth', 1.0, 0.1);
                playTone(392.00, 'sawtooth', 1.0, 0.2);
                break;
            case 'tick':
                playTone(1000, 'sine', 0.05);
                break;
        }
    }, []);

    return { playSound };
}
