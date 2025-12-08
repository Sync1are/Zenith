import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuperFocusEntryModalProps {
    isOpen: boolean;
    onConfirmEnter: () => void;
    onCancel: () => void;
    onDontAskAgain: () => void;
}

const SuperFocusEntryModal: React.FC<SuperFocusEntryModalProps> = ({
    isOpen,
    onConfirmEnter,
    onCancel,
    onDontAskAgain
}) => {
    const [dontAsk, setDontAsk] = useState(false);

    const handleConfirm = () => {
        if (dontAsk) {
            onDontAskAgain();
        }
        onConfirmEnter();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="bg-[#1a1b23] border border-white/10 rounded-2xl p-8 max-w-lg mx-4 shadow-2xl"
                    >
                        {/* Warning Icon */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 mb-4">
                                <span className="text-4xl">🔥</span>
                            </div>
                            <h2 className="text-2xl font-bold text-orange-400 mb-2">
                                Entering SUPER Focus Mode
                            </h2>
                            <p className="text-sm text-white/50">This is serious business!</p>
                        </div>

                        {/* Warning List */}
                        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-orange-500/20">
                            <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
                                <span className="text-orange-400">⚠️</span> What will happen:
                            </h3>
                            <ul className="space-y-2 text-sm text-white/60">
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-400 mt-0.5">•</span>
                                    <span>Screen will go <strong className="text-white">fullscreen</strong> and stay on top</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-400 mt-0.5">•</span>
                                    <span><strong className="text-white">Alt+Tab</strong> and other escape shortcuts will be blocked</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-400 mt-0.5">•</span>
                                    <span>Only <strong className="text-white">ESC key</strong> can exit (with confirmation)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-400 mt-0.5">•</span>
                                    <span>Quitting early will result in <strong className="text-orange-400">harsh judgment</strong> 😈</span>
                                </li>
                            </ul>
                        </div>

                        {/* Motivation */}
                        <p className="text-center text-white/70 mb-6 italic">
                            "The difference between successful people and really successful people is that really successful people say no to almost everything."
                        </p>

                        {/* Don't ask again checkbox */}
                        <label className="flex items-center gap-3 mb-6 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={dontAsk}
                                onChange={(e) => setDontAsk(e.target.checked)}
                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500/50"
                            />
                            <span className="text-sm text-white/50 group-hover:text-white/70 transition">
                                Don't show this warning again
                            </span>
                        </label>

                        {/* Buttons */}
                        <div className="flex justify-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onCancel}
                                className="px-6 py-3 rounded-xl font-bold text-sm bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all"
                            >
                                Maybe later
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleConfirm}
                                className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
                            >
                                🔥 I'm Ready, Let's Go!
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SuperFocusEntryModal;
