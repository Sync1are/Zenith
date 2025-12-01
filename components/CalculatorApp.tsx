import React, { useState } from 'react';
import { Delete, Divide, Minus, Plus, X, Equal } from 'lucide-react';

export const CalculatorApp: React.FC = () => {
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');
    const [isNewNumber, setIsNewNumber] = useState(true);

    const handleNumber = (num: string) => {
        if (isNewNumber) {
            setDisplay(num);
            setIsNewNumber(false);
        } else {
            setDisplay(display === '0' ? num : display + num);
        }
    };

    const handleOperator = (op: string) => {
        setEquation(display + ' ' + op + ' ');
        setIsNewNumber(true);
    };

    const handleEqual = () => {
        const fullEquation = equation + display;
        try {
            // eslint-disable-next-line no-eval
            const result = eval(fullEquation.replace('×', '*').replace('÷', '/'));
            setDisplay(String(result));
            setEquation('');
            setIsNewNumber(true);
        } catch (e) {
            setDisplay('Error');
            setEquation('');
            setIsNewNumber(true);
        }
    };

    const handleClear = () => {
        setDisplay('0');
        setEquation('');
        setIsNewNumber(true);
    };

    const handleDelete = () => {
        if (display.length > 1) {
            setDisplay(display.slice(0, -1));
        } else {
            setDisplay('0');
            setIsNewNumber(true);
        }
    };

    const handlePercent = () => {
        setDisplay(String(parseFloat(display) / 100));
    };

    const handleDot = () => {
        if (!display.includes('.')) {
            setDisplay(display + '.');
            setIsNewNumber(false);
        }
    };

    const buttons = [
        { label: 'C', onClick: handleClear, className: 'text-red-400 bg-red-400/10 hover:bg-red-400/20' },
        { label: '%', onClick: handlePercent, className: 'text-green-400 bg-green-400/10 hover:bg-green-400/20' },
        { label: <Delete size={20} />, onClick: handleDelete, className: 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20' },
        { label: <Divide size={20} />, onClick: () => handleOperator('/'), className: 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20' },
        { label: '7', onClick: () => handleNumber('7') },
        { label: '8', onClick: () => handleNumber('8') },
        { label: '9', onClick: () => handleNumber('9') },
        { label: <X size={20} />, onClick: () => handleOperator('*'), className: 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20' },
        { label: '4', onClick: () => handleNumber('4') },
        { label: '5', onClick: () => handleNumber('5') },
        { label: '6', onClick: () => handleNumber('6') },
        { label: <Minus size={20} />, onClick: () => handleOperator('-'), className: 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20' },
        { label: '1', onClick: () => handleNumber('1') },
        { label: '2', onClick: () => handleNumber('2') },
        { label: '3', onClick: () => handleNumber('3') },
        { label: <Plus size={20} />, onClick: () => handleOperator('+'), className: 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20' },
        { label: '0', onClick: () => handleNumber('0'), className: 'col-span-2 w-full' },
        { label: '.', onClick: handleDot },
        { label: <Equal size={20} />, onClick: handleEqual, className: 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30' },
    ];

    return (
        <div className="flex flex-col h-full bg-[#1C1C1E] text-white p-4 select-none">
            {/* Display */}
            <div className="flex-1 flex flex-col justify-end items-end mb-4 px-2">
                <div className="text-gray-400 text-sm h-6 mb-1 font-medium tracking-wide">
                    {equation.replace('*', '×').replace('/', '÷')}
                </div>
                <div className="text-5xl font-light tracking-tight break-all">
                    {display}
                </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-3">
                {buttons.map((btn, i) => (
                    <button
                        key={i}
                        onClick={btn.onClick}
                        className={`
              h-14 rounded-2xl flex items-center justify-center text-xl font-medium transition-all duration-200 active:scale-95
              ${btn.className || 'bg-white/5 hover:bg-white/10 text-white'}
            `}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
