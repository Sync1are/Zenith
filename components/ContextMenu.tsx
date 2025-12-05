import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, PinOff } from 'lucide-react';

interface ContextMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    isPinned: boolean;
    onPin: () => void;
    onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    isOpen,
    position,
    isPinned,
    onPin,
    onClose
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        position: 'fixed',
                        left: position.x,
                        top: position.y,
                        zIndex: 200
                    }}
                    className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-xl py-1 min-w-[160px]"
                >
                    <button
                        onClick={() => {
                            onPin();
                            onClose();
                        }}
                        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/40 transition-colors text-left"
                    >
                        {isPinned ? (
                            <>
                                <PinOff size={16} className="text-gray-700" />
                                <span className="text-sm font-medium text-gray-700">Unpin from Dock</span>
                            </>
                        ) : (
                            <>
                                <Pin size={16} className="text-gray-700" />
                                <span className="text-sm font-medium text-gray-700">Pin to Dock</span>
                            </>
                        )}
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
