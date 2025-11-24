
import React from 'react';
import { Stat } from '../types';
import { CheckIcon } from './icons/IconComponents';

const StatCard: React.FC<Stat> = ({ label, value, iconBgColor }) => {
    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center space-x-4">
            <div className={`p-1.5 rounded-full ${iconBgColor}`}>
                <CheckIcon className="h-4 w-4 text-white" />
            </div>
            <div>
                <p className="text-white/90 text-sm drop-shadow-md">{label}</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;