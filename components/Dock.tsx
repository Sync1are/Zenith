import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppConfig } from '../types';

interface DockProps {
    apps: AppConfig[];
    openAppIds: string[];
    activeAppId: string | null;
    onAppClick: (id: string) => void;
    isBooting?: boolean;
    onLayout?: (positions: Record<string, DOMRect>) => void;
    onAllAppsClick?: () => void;
    onAppContextMenu?: (e: React.MouseEvent, app: AppConfig) => void;
}

export const Dock = React.memo<DockProps>(({
    apps,
    openAppIds,
    activeAppId,
    onAppClick,
    isBooting,
    onLayout,
    onAllAppsClick,
    onAppContextMenu
}) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const iconRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Measure icon positions for window animations
    useEffect(() => {
        const measurePositions = () => {
            if (!onLayout) return;

            requestAnimationFrame(() => {
                const positions: Record<string, DOMRect> = {};
                iconRefs.current.forEach((element, id) => {
                    if (element) {
                        positions[id] = element.getBoundingClientRect();
                    }
                });
                onLayout(positions);
            });
        };

        measurePositions();
        window.addEventListener('resize', measurePositions);
        return () => window.removeEventListener('resize', measurePositions);
    }, [apps, onLayout, isBooting]);

    // OPTIMIZED: Auto-hide with throttled mousemove
    useEffect(() => {
        let lastCall = 0;
        const throttleMs = 50; // 20fps, very performant

        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            if (now - lastCall < throttleMs) return;
            lastCall = now;

            const distanceFromBottom = window.innerHeight - e.clientY;

            if (distanceFromBottom <= 120) {
                setIsVisible(true);
                if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                    hideTimeoutRef.current = null;
                }
            } else if (isVisible && !hideTimeoutRef.current) {
                hideTimeoutRef.current = setTimeout(() => {
                    setIsVisible(false);
                    hideTimeoutRef.current = null;
                }, 600);
            }
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, [isVisible]);

    // Keep dock visible when hovering
    const handleDockMouseEnter = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setIsVisible(true);
    };

    const handleDockMouseLeave = () => {
        hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
            hideTimeoutRef.current = null;
        }, 400);
    };

    return (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.9 }}
                animate={{
                    y: isBooting ? 100 : (isVisible ? 0 : 80),
                    opacity: isBooting ? 0 : (isVisible ? 1 : 0),
                    scale: isVisible ? 1 : 0.95
                }}
                transition={{
                    delay: isBooting ? 0.8 : 0,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                }}
                style={{ willChange: isVisible ? 'transform, opacity' : 'auto' }}
                className="
          flex items-center gap-2 p-2
          bg-white/40 backdrop-blur-md
          border border-white/30
          shadow-lg
          rounded-2xl
          pointer-events-auto
        "
                onMouseEnter={handleDockMouseEnter}
                onMouseLeave={handleDockMouseLeave}
            >
                {apps.map((app) => (
                    <button
                        key={app.id}
                        ref={(el) => {
                            if (el) iconRefs.current.set(app.id, el);
                            else iconRefs.current.delete(app.id);
                        }}
                        onClick={() => onAppClick(app.id)}
                        onContextMenu={(e) => onAppContextMenu?.(e, app)}
                        onMouseEnter={() => setHoveredId(app.id)}
                        className="relative w-12 h-12 flex items-center justify-center rounded-xl transition-transform duration-200 group"
                    >
                        {/* Sliding Spotlight Effect */}
                        {hoveredId === app.id && (
                            <motion.div
                                layoutId="dock-highlight"
                                className="absolute inset-0 bg-white/50 rounded-xl shadow-sm border border-white/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                            />
                        )}

                        {/* Active App Background */}
                        {activeAppId === app.id && hoveredId !== app.id && (
                            <div className="absolute inset-0 bg-white/20 rounded-xl border border-white/10" />
                        )}

                        {/* Icon */}
                        <div className={`
              relative z-10 transition-transform duration-200
              ${hoveredId === app.id ? 'scale-110 text-gray-900' : 'text-gray-700/80'}
              ${activeAppId === app.id ? 'text-blue-600' : ''}
            `}>
                            <app.icon size={22} strokeWidth={2} />
                        </div>

                        {/* Open Indicator Dot */}
                        {openAppIds.includes(app.id) && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-800/40 rounded-full" />
                        )}

                        {/* Tooltip */}
                        <AnimatePresence>
                            {hoveredId === app.id && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 2 }}
                                    transition={{ duration: 0.15 }}
                                    className="
                    absolute bottom-full left-1/2 -translate-x-1/2 mb-3
                    px-2.5 py-1
                    bg-white/90 backdrop-blur-sm
                    text-gray-700 text-[10px] font-medium tracking-wide uppercase
                    rounded-md shadow-sm
                    whitespace-nowrap pointer-events-none
                  "
                                >
                                    {app.title}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                ))}

                {/* Separator */}
                <div className="w-px h-6 bg-gray-400/20 mx-1" />

                {/* App Launcher */}
                <button
                    onClick={onAllAppsClick}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/20 transition-colors text-gray-600"
                    title="All Apps"
                    onMouseEnter={() => setHoveredId(null)}
                >
                    <div className="grid grid-cols-2 gap-0.5">
                        <div className="w-1 h-1 bg-current rounded-full" />
                        <div className="w-1 h-1 bg-current rounded-full" />
                        <div className="w-1 h-1 bg-current rounded-full" />
                        <div className="w-1 h-1 bg-current rounded-full" />
                    </div>
                </button >
            </motion.div >
        </div >
    );
});
