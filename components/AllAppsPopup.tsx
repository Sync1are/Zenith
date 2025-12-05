import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppConfig } from '../types';
import { X } from 'lucide-react';

interface AllAppsPopupProps {
    isOpen: boolean;
    apps: AppConfig[];
    pinnedAppIds: string[];
    onClose: () => void;
    onAppClick: (id: string) => void;
    onContextMenu: (e: React.MouseEvent, app: AppConfig) => void;
}

export const AllAppsPopup: React.FC<AllAppsPopupProps> = ({
    isOpen,
    apps,
    pinnedAppIds,
    onClose,
    onAppClick,
    onContextMenu
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />

                    {/* Popup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[600px] max-h-[70vh] overflow-hidden"
                    >
                        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">All Apps</h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* App Grid */}
                            <div className="grid grid-cols-5 gap-4 max-h-[calc(70vh-120px)] overflow-y-auto pr-2 custom-scrollbar">
                                {apps.map((app) => (
                                    <button
                                        key={app.id}
                                        onClick={() => {
                                            onAppClick(app.id);
                                            onClose();
                                        }}
                                        onContextMenu={(e) => onContextMenu(e, app)}
                                        className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/10 transition-all duration-200 relative"
                                    >
                                        {/* Pin Indicator */}
                                        {pinnedAppIds.includes(app.id) && (
                                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                        )}

                                        {/* Icon */}
                                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white/20 transition-all duration-200">
                                            <app.icon size={24} strokeWidth={2} />
                                        </div>

                                        {/* Label */}
                                        <span className="text-xs text-white/90 font-medium text-center line-clamp-2 group-hover:text-white transition-colors">
                                            {app.title}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
