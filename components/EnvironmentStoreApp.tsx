import React, { useState, useMemo } from 'react';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
    Search,
    SlidersHorizontal,
    Sparkles,
    Loader2,
    X,
    Video,
    Music,
    Plus,
    Check,
    Trash2
} from 'lucide-react';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface Environment {
    id: string;
    title: string;
    description: string;
    category: 'Nature' | 'Urban' | 'Sci-Fi' | 'Abstract';
    thumbnailUrl: string;
    audio: boolean;
    video: boolean;
    tags: string[];
}

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

export const MAX_SELECTION = 6;

export const ENVIRONMENTS: Environment[] = [
    {
        id: 'env-1',
        title: 'Neon Tokyo Rain',
        description: 'Cyberpunk city streets under heavy rain with distant synth sounds.',
        category: 'Urban',
        thumbnailUrl: 'https://picsum.photos/id/10/800/600',
        audio: true,
        video: true,
        tags: ['rain', 'city', 'night', 'cyberpunk']
    },
    {
        id: 'env-2',
        title: 'Nordic Cabin',
        description: 'Crackling fireplace inside a wooden cabin during a snowstorm.',
        category: 'Nature',
        thumbnailUrl: 'https://picsum.photos/id/11/800/600',
        audio: true,
        video: true,
        tags: ['fire', 'snow', 'cozy', 'winter']
    },
    {
        id: 'env-3',
        title: 'Orbital Station',
        description: 'Low hum of spaceship engines looking down at Earth.',
        category: 'Sci-Fi',
        thumbnailUrl: 'https://picsum.photos/id/12/800/600',
        audio: true,
        video: true,
        tags: ['space', 'scifi', 'drone', 'calm']
    },
    {
        id: 'env-4',
        title: 'Bamboo Forest',
        description: 'Wind rustling through tall bamboo stalks with bird calls.',
        category: 'Nature',
        thumbnailUrl: 'https://picsum.photos/id/13/800/600',
        audio: true,
        video: false,
        tags: ['wind', 'forest', 'zen']
    },
    {
        id: 'env-5',
        title: 'Deep Sea Lab',
        description: 'Underwater observatory with muted sonar pings.',
        category: 'Sci-Fi',
        thumbnailUrl: 'https://picsum.photos/id/14/800/600',
        audio: true,
        video: true,
        tags: ['water', 'deep', 'blue']
    },
    {
        id: 'env-6',
        title: 'Parisian Cafe',
        description: 'Ambient chatter and clinking cups on a sunny afternoon.',
        category: 'Urban',
        thumbnailUrl: 'https://picsum.photos/id/15/800/600',
        audio: true,
        video: true,
        tags: ['coffee', 'people', 'busy']
    },
    {
        id: 'env-7',
        title: 'Quantum Field',
        description: 'Abstract visualizers syncing to alpha waves.',
        category: 'Abstract',
        thumbnailUrl: 'https://picsum.photos/id/16/800/600',
        audio: true,
        video: true,
        tags: ['trippy', 'focus', 'math']
    },
    {
        id: 'env-8',
        title: 'Autumn Creek',
        description: 'Running water over pebbles with falling orange leaves.',
        category: 'Nature',
        thumbnailUrl: 'https://picsum.photos/id/17/800/600',
        audio: true,
        video: true,
        tags: ['water', 'autumn', 'peaceful']
    },
    {
        id: 'env-9',
        title: 'Subway Commute',
        description: 'Rhythmic chugging of a train moving through tunnels.',
        category: 'Urban',
        thumbnailUrl: 'https://picsum.photos/id/18/800/600',
        audio: true,
        video: true,
        tags: ['train', 'travel', 'rhythm']
    },
    {
        id: 'env-10',
        title: 'Mars Colony',
        description: 'Red dust storms outside a reinforced biodome.',
        category: 'Sci-Fi',
        thumbnailUrl: 'https://picsum.photos/id/19/800/600',
        audio: true,
        video: true,
        tags: ['mars', 'dust', 'isolation']
    },
    {
        id: 'env-11',
        title: 'White Noise Void',
        description: 'Pure static visual and audio for deep concentration.',
        category: 'Abstract',
        thumbnailUrl: 'https://picsum.photos/id/20/800/600',
        audio: true,
        video: false,
        tags: ['static', 'noise', 'pure']
    },
    {
        id: 'env-12',
        title: 'Tropical Beach',
        description: 'Waves gently crashing on sand at sunset.',
        category: 'Nature',
        thumbnailUrl: 'https://picsum.photos/id/28/800/600',
        audio: true,
        video: true,
        tags: ['ocean', 'summer', 'sunset']
    }
];

// -----------------------------------------------------------------------------
// SERVICE (GEMINI)
// -----------------------------------------------------------------------------

const getSmartSelection = async (mood: string): Promise<string[]> => {
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("VITE_GEMINI_API_KEY is not set");
            return [];
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.STRING
                    }
                }
            }
        });

        const availableEnvList = ENVIRONMENTS.map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            tags: e.tags.join(", ")
        }));

        const prompt = `
      I have a list of Environments: ${JSON.stringify(availableEnvList)}.
      
      User Mood: "${mood}".
      
      Select exactly 6 distinct environment IDs from the list that best match this mood.
      Return ONLY a JSON array of strings (the IDs).
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (!text) return [];

        const selectedIds = JSON.parse(text);
        return selectedIds;

    } catch (error) {
        console.error("Gemini Selection Error:", error);
        return [];
    }
};

// -----------------------------------------------------------------------------
// COMPONENT: EnvironmentCard
// -----------------------------------------------------------------------------

interface EnvironmentCardProps {
    environment: Environment;
    isSelected: boolean;
    onToggle: (id: string) => void;
    disabled: boolean;
}

const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
    environment,
    isSelected,
    onToggle,
    disabled
}) => {
    return (
        <div
            onClick={() => {
                if (!disabled || isSelected) {
                    onToggle(environment.id);
                }
            }}
            className={`
        group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300
        ${isSelected ? 'ring-2 ring-offset-4 ring-offset-zinc-950 ring-white' : ''}
        ${disabled && !isSelected ? 'opacity-40 grayscale pointer-events-none' : 'hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50'}
      `}
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                <img
                    src={environment.thumbnailUrl}
                    alt={environment.title}
                    className={`
            w-full h-full object-cover transition-transform duration-700 ease-out
            ${isSelected ? 'scale-105' : 'group-hover:scale-110'}
          `}
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

                {/* Selected Indicator Overlay */}
                {isSelected && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg transform scale-100 transition-transform">
                            <Check size={24} className="text-black" strokeWidth={3} />
                        </div>
                    </div>
                )}

                {/* Top Badges */}
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {environment.video && (
                        <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                            <Video size={14} />
                        </div>
                    )}
                    {environment.audio && (
                        <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                            <Music size={14} />
                        </div>
                    )}
                </div>
            </div>

            {/* Content Info (Overlaid on bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-xs font-medium text-zinc-400 mb-1">{environment.category}</p>
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg leading-tight">{environment.title}</h3>
                    {!isSelected && (
                        <button className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black hover:border-white">
                            <Plus size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// COMPONENT: SelectionDock
// -----------------------------------------------------------------------------

interface SelectionDockProps {
    selectedEnvs: Environment[];
    onRemove: (id: string) => void;
    onClear: () => void;
    onMagicClick: () => void;
}

const SelectionDock: React.FC<SelectionDockProps> = ({ selectedEnvs, onRemove, onClear, onMagicClick }) => {
    const filledCount = selectedEnvs.length;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4">
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6 shadow-2xl flex items-center gap-6">

                {/* Counter Info */}
                <div className="flex flex-col min-w-[60px]">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Capacity</span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-bold ${filledCount === MAX_SELECTION ? 'text-white' : 'text-zinc-200'}`}>
                            {filledCount}
                        </span>
                        <span className="text-sm text-zinc-600">/{MAX_SELECTION}</span>
                    </div>
                </div>

                {/* Separator */}
                <div className="w-px h-8 bg-zinc-800" />

                {/* Slots Container */}
                <div className="flex items-center gap-3">
                    {selectedEnvs.map((env) => (
                        <div key={env.id} className="group relative">
                            {/* Remove Badge */}
                            <button
                                onClick={() => onRemove(env.id)}
                                className="absolute -top-1 -right-1 z-10 w-5 h-5 bg-zinc-800 rounded-full border border-zinc-700 text-zinc-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white hover:border-red-500"
                            >
                                <X size={10} strokeWidth={3} />
                            </button>

                            {/* Circle Preview */}
                            <div className="w-12 h-12 rounded-full border-2 border-zinc-800 overflow-hidden relative group-hover:border-zinc-600 transition-colors cursor-default">
                                <img src={env.thumbnailUrl} alt={env.title} className="w-full h-full object-cover" />
                            </div>

                            {/* Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {env.title}
                            </div>
                        </div>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: MAX_SELECTION - filledCount }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pl-4 border-l border-zinc-800">
                    {filledCount > 0 && (
                        <button
                            onClick={onClear}
                            className="p-3 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                            title="Clear All"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}

                    <button
                        onClick={onMagicClick}
                        className="flex items-center gap-2 bg-white text-black px-5 py-3 rounded-full font-semibold text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
                    >
                        <Sparkles size={16} />
                        <span>Mix</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// COMPONENT: MagicMixModal
// -----------------------------------------------------------------------------

interface MagicMixModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (ids: string[]) => void;
}

const MagicMixModal: React.FC<MagicMixModalProps> = ({ isOpen, onClose, onApply }) => {
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
            } else {
                setError('Could not find enough matches. Try a different term.');
            }
        } catch (err) {
            setError('Connection failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-white">
                                <Sparkles size={24} />
                            </div>
                            <h2 className="text-2xl font-semibold text-white">AI Curator</h2>
                            <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
                                Describe your desired atmosphere, and we will build the perfect 6-slot environment for you.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-800"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="relative mb-6">
                            <input
                                type="text"
                                value={mood}
                                onChange={(e) => setMood(e.target.value)}
                                placeholder="e.g., 'Cyberpunk rainy night' or 'Quiet forest reading'"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder-zinc-600"
                                autoFocus
                            />
                            {error && (
                                <p className="text-red-400 text-xs mt-3 ml-1">{error}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !mood.trim()}
                            className="w-full bg-white text-black font-semibold text-sm rounded-xl py-4 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Curating...</span>
                                </>
                            ) : (
                                <span>Generate Collection</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// MAIN APP COMPONENT
// -----------------------------------------------------------------------------

const EnvironmentStoreApp: React.FC = () => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);

    const toggleEnvironment = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                if (prev.length >= MAX_SELECTION) {
                    return prev;
                }
                return [...prev, id];
            }
        });
    };

    const handleMagicApply = (newIds: string[]) => {
        setSelectedIds(newIds);
    };

    const categories = ['All', 'Nature', 'Urban', 'Sci-Fi', 'Abstract'];

    const filteredEnvironments = useMemo(() => {
        return ENVIRONMENTS.filter(env => {
            const matchesSearch = env.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                env.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = activeCategory === 'All' || env.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, activeCategory]);

    const selectedEnvironments = ENVIRONMENTS.filter(env => selectedIds.includes(env.id));
    const isMaxReached = selectedIds.length >= MAX_SELECTION;

    return (
        <div className="h-full overflow-y-auto bg-zinc-950 text-zinc-200 pb-32">

            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-black font-bold text-lg">Z</span>
                        </div>
                        <span className="font-medium text-lg tracking-tight text-white">Zenith</span>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <button
                            onClick={() => setIsMagicModalOpen(true)}
                            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            <Sparkles size={16} />
                            <span>AI Curator</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">

                {/* Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">

                    {/* Categories */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                  ${activeCategory === cat
                                        ? 'bg-white text-black'
                                        : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
                                    }
                `}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-zinc-500" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search environments..."
                            className="w-full md:w-64 bg-zinc-900 border border-zinc-800 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-zinc-600 transition-all placeholder-zinc-600"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEnvironments.map(env => (
                        <EnvironmentCard
                            key={env.id}
                            environment={env}
                            isSelected={selectedIds.includes(env.id)}
                            onToggle={toggleEnvironment}
                            disabled={isMaxReached && !selectedIds.includes(env.id)}
                        />
                    ))}

                    {filteredEnvironments.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-500">
                            <SlidersHorizontal size={40} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">No environments found</p>
                            <p className="text-sm mt-1">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Dock */}
            <SelectionDock
                selectedEnvs={selectedEnvironments}
                onRemove={toggleEnvironment}
                onClear={() => setSelectedIds([])}
                onMagicClick={() => setIsMagicModalOpen(true)}
            />

            {/* Modals */}
            <MagicMixModal
                isOpen={isMagicModalOpen}
                onClose={() => setIsMagicModalOpen(false)}
                onApply={handleMagicApply}
            />
        </div>
    );
};

export default EnvironmentStoreApp;
