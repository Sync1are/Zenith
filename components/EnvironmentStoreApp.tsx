import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Sparkles,
    Loader2,
    X,
    Video,
    Volume2,
    Check,
    Trash2,
    Play
} from 'lucide-react';
import { useFocusStore } from '../store/useFocusStore';
import { ENVIRONMENTS, Environment, MAX_SELECTION } from '../data/environments';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// -----------------------------------------------------------------------------
// AI CURATOR SERVICE
// -----------------------------------------------------------------------------

const getSmartSelection = async (mood: string): Promise<string[]> => {
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) return [];

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                }
            }
        });

        const availableEnvList = ENVIRONMENTS.map(e => ({
            id: e.id, title: e.title, description: e.description, tags: e.tags.join(", ")
        }));

        const prompt = `Select exactly 6 environment IDs from this list that best match the mood "${mood}": ${JSON.stringify(availableEnvList)}. Return ONLY a JSON array of ID strings.`;
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text() || '[]');
    } catch {
        return [];
    }
};

// -----------------------------------------------------------------------------
// ENVIRONMENT CARD COMPONENT
// -----------------------------------------------------------------------------

interface EnvironmentCardProps {
    environment: Environment;
    isSelected: boolean;
    onToggle: (id: string) => void;
    disabled: boolean;
    index: number;
}

const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
    environment, isSelected, onToggle, disabled, index
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Play video on hover
    React.useEffect(() => {
        if (videoRef.current) {
            if (isHovered && environment.videoUrl) {
                videoRef.current.play().catch(() => { });
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isHovered, environment.videoUrl]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => !disabled && onToggle(environment.id)}
            className={`
                group relative cursor-pointer rounded-[22px] overflow-hidden glass-panel transition-all duration-500
                ${isSelected
                    ? 'ring-2 ring-[var(--accent)] shadow-[0_0_30px_rgba(99,102,241,0.2)]'
                    : 'hover:shadow-2xl hover:scale-[1.02]'
                }
                ${disabled && !isSelected ? 'opacity-40 pointer-events-none grayscale' : ''}
            `}
        >
            {/* Media Container */}
            <div className="relative aspect-[16/10] overflow-hidden">
                {/* Thumbnail Image */}
                <img
                    src={environment.thumbnailUrl}
                    alt={environment.title}
                    className={`
                        absolute inset-0 w-full h-full object-cover transition-all duration-700
                        ${isHovered ? 'scale-110 blur-sm opacity-0' : 'scale-100'}
                    `}
                />

                {/* Video Preview (plays on hover) */}
                {environment.videoUrl && (
                    <video
                        ref={videoRef}
                        src={environment.videoUrl}
                        muted
                        loop
                        playsInline
                        className={`
                            absolute inset-0 w-full h-full object-cover transition-all duration-700
                            ${isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-100'}
                        `}
                    />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent opacity-90" />

                {/* Selection Indicator */}
                <AnimatePresence>
                    {isSelected && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                className="w-14 h-14 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-2xl"
                            >
                                <Check size={28} className="text-white" strokeWidth={3} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Badges */}
                <div className="absolute top-3 right-3 flex gap-2">
                    {environment.video && (
                        <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                            <Video size={12} className="text-white/80" />
                        </div>
                    )}
                    {environment.audio && (
                        <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                            <Volume2 size={12} className="text-white/80" />
                        </div>
                    )}
                </div>

                {/* Play indicator on hover */}
                {!isSelected && isHovered && environment.videoUrl && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-3 left-3"
                    >
                        <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <Play size={10} fill="white" className="text-white ml-0.5" />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
                    {environment.category}
                </span>
                <h3 className="text-[var(--text)] font-semibold mt-1 truncate">
                    {environment.title}
                </h3>
                <p className="text-[var(--subtle)] text-xs mt-1 line-clamp-2">
                    {environment.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                    {environment.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 text-[var(--subtle)] text-[9px]">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// -----------------------------------------------------------------------------
// SELECTION DOCK COMPONENT
// -----------------------------------------------------------------------------

interface SelectionDockProps {
    selectedEnvs: Environment[];
    onRemove: (id: string) => void;
    onClear: () => void;
    onMix: () => void;
}

const SelectionDock: React.FC<SelectionDockProps> = ({ selectedEnvs, onRemove, onClear, onMix }) => {
    const count = selectedEnvs.length;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
            <div className="glass-panel rounded-full px-4 py-2.5 flex items-center gap-4">

                {/* Capacity */}
                <div className="pl-2 flex flex-col items-center min-w-[50px]">
                    <span className="text-[8px] font-bold text-[var(--subtle)] uppercase tracking-widest">Slots</span>
                    <div className="flex items-baseline">
                        <span className={`text-lg font-bold ${count === MAX_SELECTION ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>
                            {count}
                        </span>
                        <span className="text-[var(--subtle)] text-sm">/{MAX_SELECTION}</span>
                    </div>
                </div>

                <div className="w-px h-10 bg-[var(--border)]" />

                {/* Selected Environments */}
                <div className="flex items-center gap-2">
                    {selectedEnvs.map((env) => (
                        <motion.div
                            key={env.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="group relative"
                        >
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--border)] group-hover:border-[var(--accent)] transition-colors">
                                <img src={env.thumbnailUrl} alt={env.title} className="w-full h-full object-cover" />
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(env.id); }}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:border-red-500"
                            >
                                <X size={8} className="text-[var(--text)]" />
                            </button>
                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[var(--card)] rounded text-[8px] text-[var(--text)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-[var(--border)]">
                                {env.title}
                            </div>
                        </motion.div>
                    ))}

                    {/* Empty slots */}
                    {Array.from({ length: MAX_SELECTION - count }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-10 h-10 rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center opacity-50">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
                        </div>
                    ))}
                </div>

                <div className="w-px h-10 bg-[var(--border)]" />

                {/* Actions */}
                <div className="flex items-center gap-2 pr-2">
                    {count > 0 && (
                        <button
                            onClick={onClear}
                            className="p-2 rounded-full hover:bg-white/10 text-[var(--subtle)] hover:text-red-400 transition-colors"
                            title="Clear All"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button
                        onClick={onMix}
                        className="flex items-center gap-2 bg-[var(--accent)] hover:opacity-90 text-white px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-lg"
                    >
                        <Sparkles size={14} />
                        <span>AI Mix</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// -----------------------------------------------------------------------------
// AI CURATOR MODAL
// -----------------------------------------------------------------------------

interface AICuratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (ids: string[]) => void;
}

const AICuratorModal: React.FC<AICuratorModalProps> = ({ isOpen, onClose, onApply }) => {
    const [mood, setMood] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mood.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const ids = await getSmartSelection(mood);
            if (ids.length === 6) {
                onApply(ids);
                onClose();
                setMood('');
            } else {
                setError('Could not find enough matches. Try different keywords.');
            }
        } catch {
            setError('AI service unavailable. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const suggestions = ['Rainy night coding', 'Peaceful nature retreat', 'Futuristic workspace', 'Cozy winter evening'];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg glass-panel rounded-[22px] overflow-hidden"
            >
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] flex items-center justify-center shadow-lg">
                                <Sparkles size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--text)]">AI Curator</h2>
                                <p className="text-[var(--subtle)] text-sm">Describe your ideal focus atmosphere</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-[var(--subtle)] hover:text-[var(--text)] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            placeholder="e.g., 'Calm forest with rain sounds'"
                            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] placeholder-[var(--subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors mb-4"
                            autoFocus
                        />

                        {/* Quick suggestions */}
                        <div className="flex flex-wrap gap-2 mb-5">
                            {suggestions.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setMood(s)}
                                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[var(--subtle)] hover:text-[var(--text)] text-xs transition-colors border border-[var(--border)]"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm mb-4">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !mood.trim()}
                            className="w-full bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Curating...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    <span>Generate Collection</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
};

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------

const EnvironmentStoreApp: React.FC = () => {
    const savedIds = useFocusStore((s) => s.savedEnvironmentIds);
    const setSavedIds = useFocusStore((s) => s.setSavedEnvironmentIds);
    const toggleSavedId = useFocusStore((s) => s.toggleSavedEnvironmentId);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [isCuratorOpen, setIsCuratorOpen] = useState(false);

    const categories = ['All', 'Nature', 'Urban', 'Sci-Fi', 'Abstract'];

    const filteredEnvironments = useMemo(() => {
        return ENVIRONMENTS.filter(env => {
            const matchesSearch = env.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                env.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = activeCategory === 'All' || env.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, activeCategory]);

    const selectedEnvironments = ENVIRONMENTS.filter(env => savedIds.includes(env.id));
    const isMaxReached = savedIds.length >= MAX_SELECTION;

    return (
        <div className="min-h-full text-[var(--text)] pb-32 overflow-y-auto">

            {/* Header */}
            <header className="sticky top-0 z-40 glass-panel border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm">Z</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-[var(--text)]">Environment Store</h1>
                            <p className="text-[var(--subtle)] text-xs">Curate your focus atmosphere</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCuratorOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-[var(--border)] text-sm font-medium text-[var(--subtle)] hover:text-[var(--text)] transition-all"
                    >
                        <Sparkles size={14} />
                        <span>AI Curator</span>
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Categories */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300
                                    ${activeCategory === cat
                                        ? 'bg-[var(--accent)] text-white shadow-lg'
                                        : 'bg-white/5 text-[var(--subtle)] hover:bg-white/10 hover:text-[var(--text)] border border-[var(--border)]'
                                    }
                                `}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--subtle)]" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search environments..."
                            className="w-full md:w-64 bg-white/5 border border-[var(--border)] rounded-full py-2.5 pl-10 pr-4 text-sm text-[var(--text)] placeholder-[var(--subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            <main className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredEnvironments.map((env, index) => (
                        <EnvironmentCard
                            key={env.id}
                            environment={env}
                            isSelected={savedIds.includes(env.id)}
                            onToggle={toggleSavedId}
                            disabled={isMaxReached && !savedIds.includes(env.id)}
                            index={index}
                        />
                    ))}
                </div>

                {filteredEnvironments.length === 0 && (
                    <div className="text-center py-20 text-[var(--subtle)]">
                        <p className="text-lg font-medium">No environments found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                )}
            </main>

            {/* Selection Dock */}
            <SelectionDock
                selectedEnvs={selectedEnvironments}
                onRemove={toggleSavedId}
                onClear={() => setSavedIds([])}
                onMix={() => setIsCuratorOpen(true)}
            />

            {/* AI Curator Modal */}
            <AnimatePresence>
                {isCuratorOpen && (
                    <AICuratorModal
                        isOpen={isCuratorOpen}
                        onClose={() => setIsCuratorOpen(false)}
                        onApply={setSavedIds}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default EnvironmentStoreApp;
