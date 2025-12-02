import React, { useState, useEffect, useRef } from 'react';
import {
    Check, Trash2, Plus, Sparkles, Loader2, X, ChevronDown, Smile, TrendingUp, TrendingDown, Minus, Flame,
    Zap, Target, CheckSquare, Brain, Briefcase, Calendar, Clock,
    Dumbbell, Activity, Heart, Apple, Moon, Droplet, Bike, Utensils,
    Palette, Music, Camera, PenTool, Mic, Headphones, Film, Lightbulb,
    Sun, Wind, Leaf, Coffee, BookOpen, Anchor,
    Home, ShoppingBag, Wrench, Package, Car, Dog, Hammer
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { generateRoutine } from '../../services/geminiService';
import { Habit, CompletionLog, DayColumn } from '../../types';

// ==========================================
// Constants & Icon Mapping
// ==========================================

const HABIT_COLORS = [
    { name: 'Orange', value: 'from-orange-500 to-red-500', bg: 'bg-orange-500' },
    { name: 'Purple', value: 'from-purple-500 to-indigo-500', bg: 'bg-purple-500' },
    { name: 'Green', value: 'from-green-500 to-emerald-500', bg: 'bg-green-500' },
    { name: 'Blue', value: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500' },
    { name: 'Pink', value: 'from-pink-500 to-rose-500', bg: 'bg-pink-500' },
];

const FREQUENCIES = ['Everyday', 'Weekdays', 'Weekends', '3x/Week', 'Weekly'];

// Map string names to Lucide components
const ICON_MAP: { [key: string]: React.ElementType } = {
    'Zap': Zap, 'Target': Target, 'CheckSquare': CheckSquare, 'Brain': Brain, 'Briefcase': Briefcase, 'Calendar': Calendar, 'Clock': Clock, 'TrendingUp': TrendingUp,
    'Dumbbell': Dumbbell, 'Activity': Activity, 'Heart': Heart, 'Apple': Apple, 'Moon': Moon, 'Droplet': Droplet, 'Bike': Bike, 'Utensils': Utensils,
    'Palette': Palette, 'Music': Music, 'Camera': Camera, 'PenTool': PenTool, 'Mic': Mic, 'Headphones': Headphones, 'Film': Film, 'Lightbulb': Lightbulb,
    'Sun': Sun, 'Wind': Wind, 'Leaf': Leaf, 'Flame': Flame, 'Smile': Smile, 'Coffee': Coffee, 'BookOpen': BookOpen, 'Anchor': Anchor,
    'Home': Home, 'Trash2': Trash2, 'ShoppingBag': ShoppingBag, 'Wrench': Wrench, 'Package': Package, 'Car': Car, 'Dog': Dog, 'Hammer': Hammer
};

const ICON_CATEGORIES = {
    'Productivity': ['Zap', 'Target', 'CheckSquare', 'Brain', 'Briefcase', 'Calendar', 'Clock', 'TrendingUp'],
    'Health': ['Dumbbell', 'Activity', 'Heart', 'Apple', 'Moon', 'Droplet', 'Bike', 'Utensils'],
    'Creativity': ['Palette', 'Music', 'Camera', 'PenTool', 'Mic', 'Headphones', 'Film', 'Lightbulb'],
    'Mindfulness': ['Sun', 'Wind', 'Leaf', 'Flame', 'Smile', 'Coffee', 'BookOpen', 'Anchor'],
    'Chores': ['Home', 'Trash2', 'ShoppingBag', 'Wrench', 'Package', 'Car', 'Dog', 'Hammer']
};

// ==========================================
// Component: DynamicIcon
// ==========================================

interface DynamicIconProps {
    iconName: string;
    size?: number;
    className?: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ iconName, size = 20, className }) => {
    const IconComponent = ICON_MAP[iconName];

    // Fallback for old emoji icons or missing icons
    if (!IconComponent) {
        return <span className={`text-lg ${className}`}>{iconName}</span>;
    }

    return <IconComponent size={size} className={className} />;
};

// ==========================================
// Component: AnimatedCounter
// ==========================================

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
    const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current));

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span>{display}</motion.span>;
};

// ==========================================
// Component: FireballParticles
// ==========================================

const FireballParticles: React.FC = () => {
    const particles = Array.from({ length: 12 });
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            {particles.map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                    animate={{
                        opacity: 0,
                        scale: Math.random() * 0.5 + 0.5,
                        x: (Math.random() - 0.5) * 100,
                        y: (Math.random() - 0.5) * 100,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/50"
                />
            ))}
        </div>
    );
};

// ==========================================
// Component: StreakDisplay
// ==========================================

interface StreakDisplayProps {
    habitId: string;
    completionLog: CompletionLog;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({ habitId, completionLog }) => {
    const [streak, setStreak] = useState(0);
    const [showFire, setShowFire] = useState(false);
    const prevStreakRef = useRef(0);

    useEffect(() => {
        const calculateStreak = () => {
            let count = 0;
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            // Check today
            if (completionLog[habitId]?.[todayStr]) {
                count++;
            }

            // Check past days
            let checkDate = new Date(today);
            if (!completionLog[habitId]?.[todayStr]) {
                // If today not done, start checking from yesterday
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // If today done, start checking from yesterday to add to count
                checkDate.setDate(checkDate.getDate() - 1);
            }

            while (true) {
                const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
                if (completionLog[habitId]?.[dStr]) {
                    count++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
            return count;
        };

        const currentStreak = calculateStreak();
        setStreak(currentStreak);

        // Trigger animation if streak increased
        if (currentStreak > prevStreakRef.current && currentStreak > 0) {
            setShowFire(true);
            setTimeout(() => setShowFire(false), 1000);
        }
        prevStreakRef.current = currentStreak;

    }, [completionLog, habitId]);

    return (
        <div className="relative flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/20 border border-white/5">
            {showFire && <FireballParticles />}
            <motion.div
                animate={showFire ? { scale: [1, 1.5, 1], rotate: [0, 15, -15, 0] } : {}}
                transition={{ duration: 0.5 }}
                className={`${streak > 0 ? 'text-orange-500' : 'text-white/20'}`}
            >
                <Flame size={14} fill={streak > 0 ? "currentColor" : "none"} />
            </motion.div>
            <span className={`text-xs font-bold ${streak > 0 ? 'text-white' : 'text-white/30'}`}>
                {streak}
            </span>
        </div>
    );
};

// ==========================================
// Component: StatsOverview
// ==========================================

interface StatsOverviewProps {
    habits: Habit[];
    completionLog: CompletionLog;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ habits, completionLog }) => {
    const getLocalYMD = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    let streak = 0;
    let weeklyCompleted = 0;
    let weeklyTotal = 0;

    // Calculate Streak
    const isDayPerfect = (dateStr: string, dateObj: Date) => {
        const activeHabits = habits.filter(h => {
            const created = new Date(h.createdAt);
            return created <= dateObj || getLocalYMD(created) === dateStr;
        });

        if (activeHabits.length === 0) return false;
        return activeHabits.every(h => completionLog[h.id]?.[dateStr]);
    };

    const todayStr = getLocalYMD(today);
    let checkDate = new Date(today);

    if (!isDayPerfect(todayStr, checkDate)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
        const dStr = getLocalYMD(checkDate);
        const anyHabitsActive = habits.some(h => new Date(h.createdAt) <= checkDate);
        if (!anyHabitsActive && habits.length > 0) break;

        if (isDayPerfect(dStr, checkDate)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    // Calculate Weekly Rate
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = getLocalYMD(d);

        habits.forEach(h => {
            if (new Date(h.createdAt) <= d) {
                weeklyTotal++;
                if (completionLog[h.id]?.[dStr]) {
                    weeklyCompleted++;
                }
            }
        });
    }

    const weeklyRate = weeklyTotal === 0 ? 0 : Math.round((weeklyCompleted / weeklyTotal) * 100);

    return (
        <AnimatePresence>
            {habits.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="grid grid-cols-2 gap-4 overflow-hidden"
                >
                    <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all">
                        <div className="text-sm text-white/50 mb-2">Current Streak</div>
                        <div className="text-3xl font-bold text-white">
                            <AnimatedCounter value={streak} /> <span className="text-lg text-white/50">days</span>
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all">
                        <div className="text-sm text-white/50 mb-2">This Week</div>
                        <div className="text-3xl font-bold text-white">
                            <AnimatedCounter value={weeklyRate} /><span className="text-lg text-white/50">%</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ==========================================
// Component: NewHabitForm
// ==========================================

interface NewHabitFormProps {
    onAddHabits: (habits: Habit[]) => void;
}

export const NewHabitForm: React.FC<NewHabitFormProps> = ({ onAddHabits }) => {
    const [title, setTitle] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    // Extended fields
    const [icon, setIcon] = useState('CheckSquare');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(HABIT_COLORS[0].value);
    const [frequency, setFrequency] = useState('Everyday');
    const [showIconPicker, setShowIconPicker] = useState(false);

    const [mode, setMode] = useState<'manual' | 'ai'>('manual');
    const [loading, setLoading] = useState(false);
    const iconPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
                setShowIconPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        if (mode === 'manual') {
            const newHabit: Habit = {
                id: Math.random().toString(36).substr(2, 9),
                title,
                icon,
                description,
                color,
                frequency,
                category: 'Personal',
                createdAt: new Date().toISOString(),
            };
            onAddHabits([newHabit]);
            setTitle('');
            setDescription('');
            setIsExpanded(false);
        } else {
            setLoading(true);
            try {
                const generatedHabits = await generateRoutine(title);
                onAddHabits(generatedHabits);
                setTitle('');
                setMode('manual');
                setIsExpanded(false); // Close after generation
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="mb-6 relative z-50">
            <div className={`rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 transition-all duration-300 ${isExpanded ? 'p-5' : 'p-2'}`}>
                {!isExpanded ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="flex-1 text-left px-4 py-2 text-white/50 hover:text-white transition-colors flex items-center gap-3"
                        >
                            <Plus size={18} />
                            <span>Add a new habit...</span>
                        </button>
                        <button
                            onClick={() => { setMode('ai'); setIsExpanded(true); }}
                            className="p-2 text-white/30 hover:text-purple-400 transition-colors"
                        >
                            <Sparkles size={16} />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-3">
                            {/* Icon Input */}
                            <div className="relative" ref={iconPickerRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowIconPicker(!showIconPicker)}
                                    className="w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center text-white/80 border border-white/10 hover:border-white/30 transition-all"
                                >
                                    <DynamicIcon iconName={icon} size={24} />
                                </button>

                                {showIconPicker && (
                                    <div className="absolute top-14 left-0 w-72 bg-zinc-900 border border-white/10 rounded-xl p-4 shadow-xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
                                        {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
                                            <div key={category} className="mb-3 last:mb-0">
                                                <div className="text-[10px] uppercase font-bold text-white/30 mb-2">{category}</div>
                                                <div className="grid grid-cols-6 gap-2">
                                                    {icons.map((ic) => (
                                                        <button
                                                            key={ic}
                                                            type="button"
                                                            onClick={() => { setIcon(ic); setShowIconPicker(false); }}
                                                            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                            title={ic}
                                                        >
                                                            <DynamicIcon iconName={ic} size={18} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={mode === 'ai' ? "Describe routine to generate..." : "Habit Title"}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all pr-10"
                                        autoFocus
                                        disabled={loading}
                                    />
                                    {mode === 'ai' && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400">
                                            <Sparkles size={16} />
                                        </div>
                                    )}
                                </div>
                                {mode === 'manual' && (
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Description (optional)"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
                                    />
                                )}
                            </div>
                        </div>

                        {mode === 'manual' ? (
                            <div className="flex flex-wrap gap-4 items-center pt-2">
                                {/* Colors */}
                                <div className="flex gap-1.5 bg-black/20 p-1.5 rounded-lg border border-white/5">
                                    {HABIT_COLORS.map((c) => (
                                        <button
                                            key={c.name}
                                            type="button"
                                            onClick={() => setColor(c.value)}
                                            className={`w-5 h-5 rounded-full ${c.bg} ${color === c.value ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                                        />
                                    ))}
                                </div>

                                {/* Frequency */}
                                <div className="flex gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                                    {FREQUENCIES.slice(0, 3).map((freq) => (
                                        <button
                                            key={freq}
                                            type="button"
                                            onClick={() => setFrequency(freq)}
                                            className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${frequency === freq ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                                        >
                                            {freq}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1" />

                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(false)}
                                    className="px-3 py-1.5 text-xs text-white/40 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!title.trim()}
                                    className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                                >
                                    Create
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={loading || !title.trim()}
                                    className={`px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${loading || !title.trim()
                                        ? 'bg-white/10 text-white/30 cursor-not-allowed'
                                        : 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/20'
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            Generate with AI
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

// ==========================================
// Component: HabitRow (Today View - Interactive)
// ==========================================

interface HabitRowProps {
    habit: Habit;
    days: DayColumn[];
    completionLog: CompletionLog;
    onToggle: (habitId: string, dateStr: string) => void;
    onDelete: (habitId: string) => void;
    gridClass: string;
}

export const HabitRow: React.FC<HabitRowProps> = ({ habit, days, completionLog, onToggle, onDelete, gridClass }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`grid gap-2 items-center p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/[0.07] transition-colors group ${gridClass}`}
        >
            {/* Info Column */}
            <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/80 border border-white/5 shrink-0">
                    <DynamicIcon iconName={habit.icon || 'CheckSquare'} size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">{habit.title}</h3>
                        <StreakDisplay habitId={habit.id} completionLog={completionLog} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40 truncate">
                        <span>{habit.frequency || 'Everyday'}</span>
                        {habit.description && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span className="truncate">{habit.description}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Days Columns */}
            {days.map((day) => {
                const isCompleted = completionLog[habit.id]?.[day.dateStr];
                return (
                    <div key={day.dateStr} className="flex justify-center">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onToggle(habit.id, day.dateStr)}
                            className={`
                                w-10 h-10 rounded-lg flex items-center justify-center transition-all
                                ${isCompleted
                                    ? `bg-gradient-to-br ${habit.color || 'from-white to-zinc-400'} text-white shadow-md`
                                    : 'bg-white/5 text-white/20 hover:bg-white/10 border border-white/5'
                                }
                            `}
                        >
                            {isCompleted && <Check size={18} strokeWidth={3} />}
                        </motion.button>
                    </div>
                );
            })}

            {/* Actions */}
            <div className="flex justify-center">
                <button
                    onClick={() => onDelete(habit.id)}
                    className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </motion.div>
    );
};

// ==========================================
// Component: HabitWeeklyStatsRow (Weekly View - Read Only Stats)
// ==========================================

export const HabitWeeklyStatsRow: React.FC<Omit<HabitRowProps, 'gridClass'>> = ({ habit, days, completionLog, onDelete }) => {

    // Calculate Stats
    const currentWeekCount = days.filter(d => completionLog[habit.id]?.[d.dateStr]).length;

    // Mock comparison for now
    const lastWeekCount = Math.floor(Math.random() * 5);
    const diff = currentWeekCount - lastWeekCount;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-[1fr_repeat(7,minmax(40px,60px))_120px] gap-2 items-center p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/[0.07] transition-colors group"
        >
            {/* Info */}
            <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/80 border border-white/5 shrink-0">
                    <DynamicIcon iconName={habit.icon || 'CheckSquare'} size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">{habit.title}</h3>
                        <StreakDisplay habitId={habit.id} completionLog={completionLog} />
                    </div>
                    <div className="text-xs text-white/40">{habit.frequency || 'Everyday'}</div>
                </div>
            </div>

            {/* Days (Read Only) */}
            {days.map((day) => {
                const isCompleted = completionLog[habit.id]?.[day.dateStr];
                const isPast = new Date(day.dateStr) < new Date(new Date().toDateString());

                return (
                    <div key={day.dateStr} className="flex justify-center">
                        <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center transition-all
                            ${isCompleted
                                ? `bg-gradient-to-br ${habit.color || 'from-white to-zinc-400'} text-white shadow-md`
                                : isPast
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' // Missed
                                    : 'bg-white/5 text-white/10 border border-white/5' // Future/Today Incomplete
                            }
                        `}>
                            {isCompleted ? (
                                <Check size={18} strokeWidth={3} />
                            ) : isPast ? (
                                <X size={18} strokeWidth={3} />
                            ) : null}
                        </div>
                    </div>
                );
            })}

            {/* Stats Column */}
            <div className="flex flex-col items-end justify-center px-2">
                <div className="text-lg font-bold text-white">{currentWeekCount}<span className="text-sm text-white/40 font-normal">/7</span></div>
                <div className={`text-xs flex items-center gap-1 ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-white/40'}`}>
                    {diff > 0 ? <TrendingUp size={12} /> : diff < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                    <span>{Math.abs(diff)} vs last wk</span>
                </div>
            </div>
        </motion.div>
    );
};

// ==========================================
// Component: HabitHeatmapRow (Overall View)
// ==========================================

export const HabitHeatmapRow: React.FC<Omit<HabitRowProps, 'days' | 'gridClass'>> = ({ habit, completionLog, onDelete }) => {
    // Generate last 16 weeks (approx 4 months)
    const heatmapData = React.useMemo(() => {
        const weeks = [];
        const today = new Date();
        // Align to the end of the current week (Saturday)
        const dayOfWeek = today.getDay(); // 0 = Sun, 6 = Sat
        const endOffset = 6 - dayOfWeek;
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + endOffset);

        // Generate 18 weeks back
        for (let w = 17; w >= 0; w--) {
            const weekDays = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(endDate);
                date.setDate(endDate.getDate() - (w * 7) - (6 - d));
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                weekDays.push({ dateStr, date });
            }
            weeks.push(weekDays);
        }
        return weeks;
    }, []);

    // Calculate Total Check-ins
    const totalCheckins = React.useMemo(() => {
        if (!completionLog[habit.id]) return 0;
        return Object.values(completionLog[habit.id]).filter(Boolean).length;
    }, [completionLog, habit.id]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/[0.07] transition-all group flex flex-col md:flex-row gap-6 h-full relative overflow-hidden"
        >
            {/* Delete Button (Absolute Top Right) */}
            <button
                onClick={() => onDelete(habit.id)}
                className="absolute top-4 right-4 text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 z-10"
            >
                <Trash2 size={16} />
            </button>

            {/* Left Column: Info & Stats */}
            <div className="flex flex-col justify-between min-w-[140px]">
                <div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg mb-3 bg-gradient-to-br ${habit.color || 'from-purple-500 to-indigo-500'}`}>
                        <DynamicIcon iconName={habit.icon || 'CheckSquare'} size={24} />
                    </div>
                    <h3 className="font-bold text-white text-lg leading-tight mb-1">{habit.title}</h3>
                    <div className="text-xs text-white/40 font-medium">{habit.frequency || 'Everyday'}</div>
                </div>

                <div className="mt-6 md:mt-0">
                    <div className="text-3xl font-bold text-white leading-none">{totalCheckins}</div>
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-1">Total Check-ins</div>
                </div>
            </div>

            {/* Right Column: Heatmap & Legend */}
            <div className="flex-1 flex flex-col justify-between">
                {/* Contribution Graph Heatmap */}
                <div className="flex-1 flex items-center overflow-hidden">
                    <div className="flex gap-[3px]">
                        {heatmapData.map((week, wIndex) => (
                            <div key={wIndex} className="flex flex-col gap-[3px]">
                                {week.map((day) => {
                                    const isCompleted = completionLog[habit.id]?.[day.dateStr];
                                    const isFuture = day.date > new Date();
                                    return (
                                        <div
                                            key={day.dateStr}
                                            title={day.dateStr}
                                            className={`
                                                w-3 h-3 rounded-[2px] transition-all
                                                ${isFuture
                                                    ? 'opacity-0'
                                                    : isCompleted
                                                        ? `bg-gradient-to-br ${habit.color || 'from-purple-500 to-indigo-500'} shadow-[0_0_4px_rgba(168,85,247,0.4)]`
                                                        : 'bg-white/5 hover:bg-white/10'
                                                }
                                            `}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer: Label & Legend */}
                <div className="mt-4 flex items-end justify-between">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Last 4 Months</div>

                    <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-bold uppercase tracking-wider">
                        <span>Less</span>
                        <div className="w-3 h-3 rounded-[2px] bg-white/5" />
                        <div className={`w-3 h-3 rounded-[2px] bg-gradient-to-br ${habit.color || 'from-purple-500 to-indigo-500'} opacity-50`} />
                        <div className={`w-3 h-3 rounded-[2px] bg-gradient-to-br ${habit.color || 'from-purple-500 to-indigo-500'}`} />
                        <span>More</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ==========================================
// Component: HabitGrid (Container)
// ==========================================

interface HabitGridProps {
    habits: Habit[];
    days: DayColumn[];
    completionLog: CompletionLog;
    onToggle: (habitId: string, dateStr: string) => void;
    onDelete: (habitId: string) => void;
    viewMode: 'Today' | 'Weekly' | 'Overall';
}

export const HabitGrid: React.FC<HabitGridProps> = ({ habits, days, completionLog, onToggle, onDelete, viewMode }) => {

    // Determine grid columns based on view mode
    const gridClass = viewMode === 'Weekly'
        ? 'grid-cols-[1fr_repeat(7,minmax(40px,60px))_120px]' // Weekly Stats
        : 'grid-cols-[1fr_repeat(7,minmax(40px,60px))_50px]'; // Today (Interactive)

    // Header
    const renderHeader = () => (
        <div className={`grid ${gridClass} gap-2 mb-3 px-3`}>
            <div className="text-xs font-bold text-white/30 uppercase tracking-wider">Habit</div>
            {days.map((day) => (
                <div key={day.dateStr} className="text-center">
                    <div className="text-[10px] text-white/30 mb-1">{day.dayName}</div>
                    <div className={`text-xs font-bold ${day.isToday ? 'text-white' : 'text-white/30'}`}>
                        {day.dayNumber}
                    </div>
                </div>
            ))}
            {viewMode === 'Weekly' ? (
                <div className="text-xs font-bold text-white/30 text-right uppercase tracking-wider">Stats</div>
            ) : (
                <div></div>
            )}
        </div>
    );

    return (
        <div className="min-w-[800px] overflow-x-auto">
            {viewMode !== 'Overall' && renderHeader()}

            <div className={`${viewMode === 'Overall' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-2'}`}>
                <AnimatePresence mode="popLayout">
                    {habits.map((habit) => (
                        <React.Fragment key={habit.id}>
                            {viewMode === 'Overall' ? (
                                <HabitHeatmapRow
                                    habit={habit}
                                    completionLog={completionLog}
                                    onToggle={onToggle}
                                    onDelete={onDelete}
                                />
                            ) : viewMode === 'Weekly' ? (
                                <HabitWeeklyStatsRow
                                    habit={habit}
                                    days={days}
                                    completionLog={completionLog}
                                    onToggle={onToggle}
                                    onDelete={onDelete}
                                />
                            ) : (
                                <HabitRow
                                    habit={habit}
                                    days={days}
                                    completionLog={completionLog}
                                    onToggle={onToggle}
                                    onDelete={onDelete}
                                    gridClass={gridClass}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
