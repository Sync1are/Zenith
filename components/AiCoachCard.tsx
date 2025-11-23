import React from 'react';

const AiCoachCard: React.FC = () => {
    return (
        <div className="relative p-8 rounded-3xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 h-full flex flex-col justify-between min-h-[300px]">
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1532309488615-5234533fee89?q=80&w=2070&auto=format&fit=crop"
                    className="w-full h-full object-cover opacity-20"
                    alt="background"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
            </div>

            <div className="relative z-10">
                <p className="font-semibold text-[var(--accent)]">AI Accountability Coach</p>
                <h2 className="text-4xl font-bold text-[var(--text)] mt-2">Optimize Your Day</h2>
                <p className="mt-2 max-w-md text-[var(--subtle)]">
                    Your schedule seems packed. Let's break down 'Project Phoenix' into smaller, manageable tasks.
                </p>
            </div>

            <div className="relative z-10 mt-6">
                <button
                    onClick={() => alert('AI task breakdown is not yet implemented.')}
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
