import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

const AMBIENT_SOUNDS = [
    { id: "rain", url: "https://cdn.pixabay.com/download/audio/2025/06/04/audio_df889d8576.mp3?filename=relaxing-ambient-music-rain-354479.mp3" },
    { id: "ocean", url: "https://cdn.pixabay.com/download/audio/2025/08/17/audio_7f0f710ebf.mp3?filename=ocean-vibes-391210.mp3" },
    { id: "forest", url: "https://cdn.pixabay.com/download/audio/2025/07/16/audio_152c624e23.mp3?filename=ambient-forest-rain-375365.mp3" },
    { id: "fireplace", url: "https://cdn.pixabay.com/download/audio/2025/03/30/audio_574326194d.mp3?filename=ambient-burning-castle-320841.mp3" },
    { id: "cafe", url: "https://cdn.pixabay.com/download/audio/2025/06/13/audio_14102ea978.mp3?filename=dreamy-cafe-music-347413.mp3" },
    { id: "space", url: "https://cdn.pixabay.com/download/audio/2022/03/24/audio_07969e45f9.mp3?filename=space-chillout-14194.mp3" },
];

const AmbientPlayer: React.FC = () => {
    const { ambientSound } = useAppStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Cleanup previous audio if ID changes or if stopped
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (ambientSound.id && ambientSound.isPlaying) {
            const sound = AMBIENT_SOUNDS.find(s => s.id === ambientSound.id);
            if (sound) {
                const audio = new Audio(sound.url);
                audio.loop = true;
                audio.volume = ambientSound.volume;
                audio.play().catch(e => console.error("Ambient audio play failed:", e));
                audioRef.current = audio;
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [ambientSound.id, ambientSound.isPlaying]);

    // Handle volume changes separately to avoid restarting audio
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = ambientSound.volume;
        }
    }, [ambientSound.volume]);

    return null; // Invisible component
};

export default AmbientPlayer;
