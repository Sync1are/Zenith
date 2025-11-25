// utils/clickSound.ts
// Utility to generate and play a mechanical keyboard-like click sound using Web Audio API

let audioContext: AudioContext | null = null;

/**
 * Initialize the audio context (lazy initialization)
 */
const getAudioContext = (): AudioContext => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

/**
 * Play a mechanical keyboard-like click sound
 * Simulates the sound of a mechanical keyboard key press with multiple frequencies and sharp attack
 */
export const playClickSound = (): void => {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const clickDuration = 0.04; // 40ms - short and snappy

        // Create a master gain node for overall volume control
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        masterGain.gain.setValueAtTime(0.03, now); // Overall volume - softer

        // High frequency component (simulates the "clack") - LOWERED PITCH
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.frequency.setValueAtTime(800, now); // Lowered from 1200Hz
        osc1.type = 'square'; // More percussive than sine

        // Very sharp attack and quick decay for the high component
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.6, now + 0.002); // Very fast attack (2ms)
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.015); // Quick fade

        // Mid frequency component (body of the sound) - LOWERED PITCH
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.frequency.setValueAtTime(250, now); // Lowered from 400Hz
        osc2.type = 'triangle'; // Softer than square, but still punchy

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.3, now + 0.003);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.025);

        // Low frequency component (the "thock") - LOWERED PITCH
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.connect(gain3);
        gain3.connect(masterGain);
        osc3.frequency.setValueAtTime(100, now); // Lowered from 150Hz
        osc3.type = 'sine';

        gain3.gain.setValueAtTime(0, now);
        gain3.gain.linearRampToValueAtTime(0.2, now + 0.005);
        gain3.gain.exponentialRampToValueAtTime(0.01, now + clickDuration);

        // Start all oscillators
        osc1.start(now);
        osc2.start(now);
        osc3.start(now);

        // Stop all oscillators
        osc1.stop(now + clickDuration);
        osc2.stop(now + clickDuration);
        osc3.stop(now + clickDuration);

        // Clean up when done
        osc1.onended = () => {
            osc1.disconnect();
            osc2.disconnect();
            osc3.disconnect();
            gain1.disconnect();
            gain2.disconnect();
            gain3.disconnect();
            masterGain.disconnect();
        };
    } catch (error) {
        // Silently fail if audio playback fails (e.g., browser restrictions)
        console.warn('Click sound playback failed:', error);
    }
};

/**
 * Resume audio context if it's suspended (required by some browsers)
 * Call this on user interaction to ensure audio can play
 */
export const resumeAudioContext = async (): Promise<void> => {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
    } catch (error) {
        console.warn('Failed to resume audio context:', error);
    }
};
