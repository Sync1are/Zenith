import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocusStore } from "../store/useFocusStore";
import { ENVIRONMENTS } from "../data/environments";

const LiveBackground: React.FC = () => {
    const activeEnvironmentId = useFocusStore((state) => state.activeEnvironmentId);
    const [activeVideo, setActiveVideo] = useState<string>("");
    const [overlayOpacity] = useState(0.3); // Default overlay opacity

    useEffect(() => {
        if (activeEnvironmentId) {
            const env = ENVIRONMENTS.find(e => e.id === activeEnvironmentId);
            if (env && env.videoUrl) {
                setActiveVideo(env.videoUrl);
            } else {
                setActiveVideo("");
            }
        } else {
            setActiveVideo("");
        }
    }, [activeEnvironmentId]);

    if (!activeVideo) return null;

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            {/* Fallback/Base dim to ensure text is readable even if video loads slowly */}
            <div className="absolute inset-0 bg-[#111217]" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeEnvironmentId}
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

export default React.memo(LiveBackground);
