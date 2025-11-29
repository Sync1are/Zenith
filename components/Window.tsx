import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react';
import { AppConfig } from '../types';

interface WindowProps {
    app: AppConfig;
    isOpen: boolean;
    isMinimized: boolean;
    isActive: boolean;
    zIndex: number;
    iconRect?: DOMRect;
    onClose: () => void;
    onMinimize: () => void;
    onFocus: () => void;
}

const getVariants = (width: number, height: number): Variants => {
    return {
        initial: (custom: { iconRect?: DOMRect }) => {
            if (!custom?.iconRect) {
                return { opacity: 0, scale: 0.8, y: 100, x: 0 };
            }

            const windowCenterX = window.innerWidth / 2;
            const windowCenterY = 100 + height / 2;
            const iconCenterX = custom.iconRect.left + custom.iconRect.width / 2;
            const iconCenterY = custom.iconRect.top + custom.iconRect.height / 2;

            return {
                x: iconCenterX - windowCenterX,
                y: iconCenterY - windowCenterY,
                scale: 0.05,
                opacity: 0,
            };
        },
        animate: {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 28,
            }
        },
        exit: (custom: { iconRect?: DOMRect }) => {
            if (!custom?.iconRect) {
                return { opacity: 0, scale: 0.8, y: 100, transition: { duration: 0.15 } };
            }

            const windowCenterX = window.innerWidth / 2;
            const windowCenterY = 100 + height / 2;
            const iconCenterX = custom.iconRect.left + custom.iconRect.width / 2;
            const iconCenterY = custom.iconRect.top + custom.iconRect.height / 2;

            return {
                x: iconCenterX - windowCenterX,
                y: iconCenterY - windowCenterY,
                scale: 0.05,
                opacity: 0,
                transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] }
            };
        }
    };
};

export const Window: React.FC<WindowProps> = ({
    app,
    isOpen,
    isMinimized,
    isActive,
    zIndex,
    iconRect,
    onClose,
    onMinimize,
    onFocus
}) => {
    const width = app.width || 600;
    const height = app.height || 500;
    const [isDragging, setIsDragging] = useState(false);

    const variants = React.useMemo(() => getVariants(width, height), [width, height]);

    return (
        <AnimatePresence>
            {isOpen && !isMinimized && (
                <motion.div
                    custom={{ iconRect }}
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
                    onDragStart={() => {
                        setIsDragging(true);
                        onFocus();
                    }}
                    onDragEnd={() => setIsDragging(false)}
                    onMouseDown={onFocus}
                    style={{
                        zIndex,
                        position: 'absolute',
                        left: `calc(50% - ${width / 2}px)`,
                        top: '100px',
                        width: width,
                        height: height,
                        transformOrigin: "center center",
                        // CRITICAL: Use simple box-shadow during drag for performance
                        boxShadow: isDragging
                            ? '0 25px 50px rgba(0,0,0,0.25)'
                            : '0 20px 40px rgba(0,0,0,0.15)',
                        // GPU acceleration hints
                        willChange: isDragging ? 'transform' : 'auto',
                    }}
                    className={`
            flex flex-col overflow-hidden rounded-2xl
            bg-white/80 border border-white/50
            transition-shadow duration-150
            ${isActive ? '' : 'opacity-90'}
          `}
                >
                    {/* Title Bar - Drag Handle */}
                    <div
                        className="h-10 flex items-center justify-between px-4 select-none cursor-grab active:cursor-grabbing bg-white/20"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            onFocus();
                        }}
                    >
                        {/* Traffic Lights */}
                        <div className="flex gap-2 group z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors"
                            >
                                <X size={7} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onMinimize(); }}
                                className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors"
                            >
                                <Minus size={7} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button
                                className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 transition-colors"
                            >
                                <Maximize2 size={7} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>

                        <div className="absolute left-0 right-0 text-center pointer-events-none text-xs font-semibold text-gray-700/90">
                            {app.title}
                        </div>

                        <div className="w-10"></div>
                    </div>

                    {/* Content Area */}
                    <div
                        className="flex-1 overflow-hidden relative bg-white/60"
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                            // Disable pointer events on iframe during drag for smooth dragging
                            pointerEvents: isDragging ? 'none' : 'auto'
                        }}
                    >
                        {app.component}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
