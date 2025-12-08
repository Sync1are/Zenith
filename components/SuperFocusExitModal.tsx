import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuperFocusExitModalProps {
    isOpen: boolean;
    elapsedMinutes: number;
    allTasksComplete: boolean;
    onConfirmExit: () => void;
    onCancel: () => void;
}

// Harsh messages for early quitters (< 70 min)
const HARSH_MESSAGES = [
    { title: "Already giving up?", message: "You barely started. Push through this!" },
    { title: "What a quitter!", message: "Go Get some balls man dont be a pussy. You can do it champ!" },
    { title: "Seriously?", message: "Really?? No even an hour?? You're better than this... or are you? 🤔" },
    { title: "Weak sauce!", message: "Your future self is disappointed, I mean I am disappointed. Click +10m break instead?" },
    { title: "Running away?", message: "Winners don't quit. Losers don't win. Pick your side." },
    { title: "Is this a joke?", message: "My grandma has more focus than you right now." },
    { title: "Pathetic!", message: "WHAT?? That's it?? Jeez!! Yeah at this point you should'nt even try Just give up on your Goals and dreams..... or you can just prove me wrong by pressing NO 🤷." },
];

// Encouraging messages for long sessions (70+ min)
const CONGRATS_MESSAGES = [
    { title: "🎉 Amazing work!", message: "You've been focused for over an hour! We're proud of you." },
    { title: "🔥 Absolute beast!", message: "HELL YEAH!! THAT'S MY BOI YOU DID OVER AN HOUR!! FULLY DESERVED" },
    { title: "⭐ Superstar!", message: "You crushed it! Your dedication is inspiring. Your dad would be proud!!!" },
    { title: "💪 Champion!", message: "What a session! You should be proud of yourself." },
];

// Messages for when all tasks are complete (even if < 70 min)
const PRODUCTIVITY_CHAMPION_MESSAGES = [
    { title: "🚀 All tasks done!", message: "Damn already finished everything?? You're a productivity machine!" },
    { title: "⚡ Speed demon!", message: "All tasks crushed! Want to add more or take a well-deserved break?" },
    { title: "🏆 Task slayer!", message: "Zero tasks remaining! You're on fire today 🔥" },
    { title: "✨ Efficiency king!", message: "Finished everything? We could always be MORE productive... or take a break 😏" },
];

const SuperFocusExitModal: React.FC<SuperFocusExitModalProps> = ({
    isOpen,
    elapsedMinutes,
    allTasksComplete,
    onConfirmExit,
    onCancel
}) => {
    const [promptIndex, setPromptIndex] = useState(0);
    const [swapButtons, setSwapButtons] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const isLongSession = elapsedMinutes >= 70;
    const isPositiveExit = isLongSession || allTasksComplete;

    // Pick the right message set
    let messages = HARSH_MESSAGES;
    if (allTasksComplete) {
        messages = PRODUCTIVITY_CHAMPION_MESSAGES;
    } else if (isLongSession) {
        messages = CONGRATS_MESSAGES;
    }

    const maxPrompts = isPositiveExit ? 1 : 3; // Only 1 prompt for positive exits, 3 for early exits

    useEffect(() => {
        if (isOpen) {
            setPromptIndex(0);
            setSwapButtons(Math.random() > 0.5);
            setShowModal(true);
        } else {
            setShowModal(false);
        }
    }, [isOpen]);

    const handleYesClick = () => {
        if (promptIndex < maxPrompts - 1 && !isLongSession) {
            // Show next prompt with new message and random button positions
            setPromptIndex(prev => prev + 1);
            setSwapButtons(Math.random() > 0.5);
        } else {
            // Final confirmation - actually exit
            onConfirmExit();
        }
    };

    const currentMessage = messages[promptIndex % messages.length];

    const YesButton = (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleYesClick}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
        >
            {isLongSession ? "Yes, I'm done" : `Yes, I quit ${promptIndex < maxPrompts - 1 ? `(${promptIndex + 1}/${maxPrompts})` : ''}`}
        </motion.button>
    );

    const NoButton = (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
        >
            {isLongSession ? "Keep going!" : "No, let's continue! 💪"}
        </motion.button>
    );

    return (
        <AnimatePresence>
            {showModal && (
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
                        className="bg-[#1a1b23] border border-white/10 rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
                    >
                        {/* Timer display */}
                        <div className="text-center mb-6">
                            <div className="text-4xl font-mono font-bold text-white mb-2">
                                {Math.floor(elapsedMinutes)}:{String(Math.floor((elapsedMinutes % 1) * 60)).padStart(2, '0')}
                            </div>
                            <p className="text-xs text-white/40 uppercase tracking-wider">Time focused</p>
                        </div>

                        {/* Message */}
                        <div className="text-center mb-8">
                            <h2 className={`text-2xl font-bold mb-3 ${isLongSession ? 'text-emerald-400' : 'text-orange-400'}`}>
                                {currentMessage.title}
                            </h2>
                            <p className="text-white/70">
                                {currentMessage.message}
                            </p>
                        </div>

                        {/* Progress indicator for harsh prompts */}
                        {!isLongSession && maxPrompts > 1 && (
                            <div className="flex justify-center gap-2 mb-6">
                                {Array.from({ length: maxPrompts }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full transition-all ${i <= promptIndex ? 'bg-orange-500' : 'bg-white/20'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Buttons - position swapped randomly */}
                        <div className="flex justify-center gap-4">
                            {swapButtons ? (
                                <>
                                    {YesButton}
                                    {NoButton}
                                </>
                            ) : (
                                <>
                                    {NoButton}
                                    {YesButton}
                                </>
                            )}
                        </div>

                        {/* Break suggestion for early exits */}
                        {!isLongSession && (
                            <p className="text-center text-xs text-white/30 mt-6">
                                💡 Try taking a +10m break instead of quitting completely
                            </p>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SuperFocusExitModal;
