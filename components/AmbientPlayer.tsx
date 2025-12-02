
import React, { useEffect, useRef } from 'react';
import { useFocusStore } from '../store/useFocusStore';
import { ENVIRONMENTS } from '../data/environments';

const AmbientPlayer: React.FC = () => {
    const activeEnvironmentId = useFocusStore((s) => s.activeEnvironmentId);
    const environmentVolume = useFocusStore((s) => s.environmentVolume);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Cleanup previous audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (activeEnvironmentId) {
            const env = ENVIRONMENTS.find(e => e.id === activeEnvironmentId);
            if (env && env.audioUrl) {
                const audio = new Audio(env.audioUrl);
                audio.loop = true;
                audio.volume = environmentVolume;
                audio.play().catch(e => console.error("Audio play failed:", e));
                audioRef.current = audio;
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [activeEnvironmentId]);

    // Update volume when slider changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = environmentVolume;
        }
    }, [environmentVolume]);

    return null; // Headless component
};

export default AmbientPlayer;
