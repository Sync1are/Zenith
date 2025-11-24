import React from 'react';
import { useAppStore } from '../store/useAppStore';

const AiCoachCard: React.FC = () => {
    const setActivePage = useAppStore(state => state.setActivePage);
    const triggerAiTaskModal = useAppStore(state => state.triggerAiTaskModal);

    const handleBreakdown = () => {
        setActivePage('Tasks');
        triggerAiTaskModal(true);
    };

    return (
        <div className="relative p-8 rounded-3xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 h-full flex flex-col justify-between min-h-[300px]">
            <div className="absolute inset-0">

            </div>

            <div className="relative z-10">
                <p className="font-semibold text-blue-200 drop-shadow-sm">AI Accountability Coach</p>
                <h2 className="text-4xl font-bold text-white mt-2 drop-shadow-md">Optimize Your Day</h2>
                <p className="mt-2 max-w-md text-white/90 drop-shadow-sm font-medium">
                    Your schedule seems packed. Let's break down 'Project Phoenix' into smaller, manageable tasks.
                </p>
            </div>

            <div className="relative z-10 mt-6">
                <button
                    onClick={handleBreakdown}
                    className="
                        px-6 py-2
                        font-semibold
                        rounded-lg
                        border-2
                        transition-colors
                        bg-[var(--bg)]
                        text-[var(--text)]
                        border-[var(--text)]
                        hover:bg-[var(--text)]
                        hover:text-[var(--bg)]
                        z-index-1
                    "
                >
                    Break it down!
                </button>
            </div>
        </div>
    );
};

export default AiCoachCard;
