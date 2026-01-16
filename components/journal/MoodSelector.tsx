import React from 'react';
import { motion } from 'framer-motion';
import { MOODS } from './constants';

interface MoodSelectorProps {
    value: number | null | undefined;
    onChange: (mood: number) => void;
    size?: 'sm' | 'md';
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ value, onChange, size = 'md' }) => {
    const sizeClasses = size === 'sm' ? 'w-8 h-8 text-base' : 'w-10 h-10 text-xl';

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-white/50 mr-2">Mood:</span>
            {MOODS.map((mood) => (
                <motion.button
                    key={mood.value}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onChange(mood.value)}
                    className={`
                        ${sizeClasses} rounded-full flex items-center justify-center
                        transition-all duration-200
                        ${value === mood.value
                            ? 'ring-2 ring-offset-2 ring-offset-[#111215]'
                            : 'opacity-50 hover:opacity-100'}
                    `}
                    style={{
                        backgroundColor: `${mood.color}20`,
                        ...(value === mood.value ? { boxShadow: `0 0 0 2px ${mood.color}` } : {})
                    }}
                    title={mood.label}
                >
                    {mood.emoji}
                </motion.button>
            ))}
        </div>
    );
};

export default MoodSelector;
