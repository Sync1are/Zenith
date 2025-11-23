import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocusStore, EnvironmentId } from "../store/useFocusStore";

// Video sources - using high quality Pexels/Pixabay placeholders
// In a real app, these should be hosted on a CDN
const ENVIRONMENTS: Record<EnvironmentId, { video: string; overlay: number }> = {
    none: { video: "", overlay: 0 },
    cafe: {
        video: "https://cdn.pixabay.com/video/2024/08/08/225363_small.mp4", // Coffee shop vibe
        overlay: 0.4
    },
    rain: {
        video: "https://cdn.pixabay.com/video/2021/05/26/75368-555547951_small.mp4", // Rainy window
        overlay: 0.3
    },
    forest: {
        video: "https://cdn.pixabay.com/video/2025/04/07/270595_tiny.mp4", // Forest path
        overlay: 0.3
    },
    space: {
        video: "https://cdn.pixabay.com/video/2017/06/28/10339-865412856_medium.mp4", // Deep space nebula
        overlay: 0.2
    },
    ocean: {
        video: "https://cdn.pixabay.com/video/2025/10/12/309500_small.mp4", // Ocean waves
        overlay: 0.2
    },
    library: {
        video: "https://cdn.pixabay.com/video/2022/02/14/107665-677693991_large.mp4", // Library/Books
        overlay: 0.4
    },
    fireplace: {
        video: "https://cdn.pixabay.com/video/2023/10/26/186611-878455887_small.mp4", // Cozy fireplace
        overlay: 0.3
    }
};

const LiveBackground: React.FC = () => {
    const environment = useFocusStore((state) => state.environment);
    const [activeVideo, setActiveVideo] = useState<string>("");
    const [overlayOpacity, setOverlayOpacity] = useState(0);

    useEffect(() => {
        const config = ENVIRONMENTS[environment];
        if (config) {
            setActiveVideo(config.video);
            setOverlayOpacity(config.overlay);
        }
    }, [environment]);

    if (environment === "none" || !activeVideo) return null;

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            {/* Fallback/Base dim to ensure text is readable even if video loads slowly */}
            <div className="absolute inset-0 bg-[#111217]" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={environment}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Video Layer */}
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        src={activeVideo}
                    />

                    {/* Overlay Layer for readability */}
                    <div
                        className="absolute inset-0 bg-black transition-opacity duration-1000"
                        style={{ opacity: overlayOpacity }}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default LiveBackground;
