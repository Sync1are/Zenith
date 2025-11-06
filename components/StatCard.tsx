
import React from 'react';
import { Stat } from '../types';
import { CheckIcon } from './icons/IconComponents';

const StatCard: React.FC<Stat> = ({ label, value, iconBgColor }) => {
    return (
        <div className="bg-[#1C1C1E] border border-gray-800 rounded-2xl p-5 flex items-center space-x-4">
            <div className={`p-1.5 rounded-full ${iconBgColor}`}>
               <CheckIcon className="h-4 w-4 text-white" />
            </div>
            <div>
                <p className="text-gray-400 text-sm">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;