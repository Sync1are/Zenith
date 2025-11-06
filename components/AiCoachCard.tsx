
import React from 'react';

const AiCoachCard: React.FC = () => {
    return (
        <div className="relative p-8 rounded-3xl overflow-hidden bg-[#1C1C1E] border border-gray-800 h-full flex flex-col justify-between min-h-[300px]">
            <div className="absolute inset-0">
                <img src="https://images.unsplash.com/photo-1532309488615-5234533fee89?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-20" alt="background" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1C1C1E] via-[#1C1C1E]/50 to-transparent"></div>
            </div>
            <div className="relative z-10">
                <p className="text-orange-400 font-semibold">AI Accountability Coach</p>
                <h2 className="text-4xl font-bold text-white mt-2">Optimize Your Day</h2>
                <p className="text-gray-300 mt-2 max-w-md">Your schedule seems packed. Let's break down 'Project Phoenix' into smaller, manageable tasks.</p>
            </div>
            <div className="relative z-10 mt-6">
                <button 
                    onClick={() => alert('AI task breakdown is not yet implemented.')}
                    className="px-6 py-2 bg-black text-white font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-black transition-colors"
                >
                    Break it down!
                </button>
            </div>
        </div>
    );
};

export default AiCoachCard;