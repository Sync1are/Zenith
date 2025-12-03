
export interface Environment {
    id: string;
    title: string;
    description: string;
    category: 'Nature' | 'Urban' | 'Sci-Fi' | 'Abstract';
    thumbnailUrl: string;
    audio: boolean;
    video: boolean;
    tags: string[];
    audioUrl?: string; // Added audio URL
    videoUrl?: string; // Added video URL for background
    color?: string; // Added for UI gradients
    icon?: string; // Added for UI icons
}

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
        tags: ['rain', 'city', 'night', 'cyberpunk'],
        audioUrl: 'https://cdn.pixabay.com/download/audio/2025/06/04/audio_df889d8576.mp3?filename=relaxing-ambient-music-rain-354479.mp3',
        videoUrl: 'https://cdn.pixabay.com/video/2021/05/26/75368-555547951_small.mp4',
        color: 'from-blue-500 to-cyan-500',
        icon: '🌧️'
    },
    {
        id: 'env-2',
        title: 'Nordic Cabin',
        description: 'Crackling fireplace inside a wooden cabin during a snowstorm.',
        category: 'Nature',
        thumbnailUrl: 'https://picsum.photos/id/11/800/600',
        audio: true,
        video: true,
        tags: ['fire', 'snow', 'cozy', 'winter'],
        audioUrl: 'https://cdn.pixabay.com/download/audio/2025/03/30/audio_574326194d.mp3?filename=ambient-burning-castle-320841.mp3',
        videoUrl: 'https://cdn.pixabay.com/video/2023/10/26/186611-878455887_large.mp4',
        color: 'from-orange-500 to-red-500',
        icon: '🔥'
    },
    {
        id: 'env-3',
        title: 'Orbital Station',
        description: 'Low hum of spaceship engines looking down at Earth.',
        category: 'Sci-Fi',
        thumbnailUrl: 'https://picsum.photos/id/12/800/600',
        audio: true,
        video: true,
        tags: ['space', 'scifi', 'drone', 'calm'],
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_07969e45f9.mp3?filename=space-chillout-14194.mp3',
        videoUrl: 'https://cdn.pixabay.com/video/2022/11/27/140733-775596128_large.mp4',
        color: 'from-purple-500 to-indigo-500',
        icon: '🌌'
    },
    {
        id: 'env-4',
        title: 'Bamboo Forest',
        description: 'Wind rustling through tall bamboo stalks with bird calls.',
        category: 'Nature',
        thumbnailUrl: 'https://picsum.photos/id/13/800/600',
        audio: true,
        video: false,
        tags: ['wind', 'forest', 'zen'],
        audioUrl: 'https://cdn.pixabay.com/download/audio/2025/07/16/audio_152c624e23.mp3?filename=ambient-forest-rain-375365.mp3',
        videoUrl: 'https://cdn.pixabay.com/video/2025/09/22/305657_tiny.mp4',
        color: 'from-green-500 to-emerald-500',
        icon: '🌲'
    },
    {
        id: 'env-5',
        title: 'Deep Sea Lab',
        description: 'Underwater observatory with muted sonar pings.',
        category: 'Sci-Fi',
        thumbnailUrl: 'https://picsum.photos/id/14/800/600',
        audio: true,
        video: true,
        tags: ['water', 'deep', 'blue'],
        audioUrl: 'https://cdn.pixabay.com/download/audio/2025/08/17/audio_7f0f710ebf.mp3?filename=ocean-vibes-391210.mp3',
        videoUrl: 'https://cdn.pixabay.com/video/2021/05/26/75368-555547951_small.mp4',
        color: 'from-blue-600 to-indigo-900',
        icon: '🐋'
    },
    {
        id: 'env-6',
        title: 'Parisian Cafe',
        description: 'Ambient chatter and clinking cups on a sunny afternoon.',
        category: 'Urban',
        thumbnailUrl: 'https://picsum.photos/id/15/800/600',
        audio: true,
        video: true,
        tags: ['coffee', 'people', 'busy'],
        audioUrl: 'https://cdn.pixabay.com/download/audio/2025/06/13/audio_14102ea978.mp3?filename=dreamy-cafe-music-347413.mp3',
        videoUrl: 'https://cdn.pixabay.com/video/2024/08/08/225363_small.mp4',
        color: 'from-amber-500 to-orange-500',
        icon: '☕'
    },
    {
        id: 'env-7',
        title: 'Quantum Field',
        description: 'Abstract visualizers syncing to alpha waves.',
        category: 'Abstract',
        thumbnailUrl: 'https://picsum.photos/id/16/800/600',
        audio: true,
        video: true,

        tags: ['trippy', 'focus', 'math'],
        audioUrl: '', // TODO: Add URL
        color: 'from-pink-500 to-rose-500',
        icon: '⚛️'
    },
    {
        id: 'env-8',
        title: 'Autumn Creek',
        description: 'Running water over pebbles with falling orange leaves.',
        category: 'Nature',
        thumbnailUrl: 'https://picsum.photos/id/17/800/600',
        audio: true,
        video: true,
        tags: ['water', 'autumn', 'peaceful'],
        audioUrl: '', // TODO: Add URL
        videoUrl: 'https://cdn.pixabay.com/video/2025/12/03/319576.mp4',
        color: 'from-orange-400 to-amber-600',
        icon: '🍂'
    },
    {
        id: 'env-9',
        title: 'Subway Commute',
        description: 'Rhythmic chugging of a train moving through tunnels.',
        category: 'Urban',
        thumbnailUrl: 'https://picsum.photos/id/18/800/600',
        audio: true,
        video: true,
        tags: ['train', 'travel', 'rhythm'],
        audioUrl: '', // TODO: Add URL
        color: 'from-zinc-500 to-zinc-700',
        icon: '🚇'
    },
    {
        id: 'env-10',
        title: 'Mars Colony',
        description: 'Red dust storms outside a reinforced biodome.',
        category: 'Sci-Fi',
        thumbnailUrl: 'https://picsum.photos/id/19/800/600',
        audio: true,
        video: true,
        tags: ['mars', 'dust', 'isolation'],
        audioUrl: '', // TODO: Add URL
        color: 'from-red-600 to-orange-700',
        icon: '🚀'
    },
    {
        id: 'env-11',
        title: 'White Noise Void',
        description: 'Pure static visual and audio for deep concentration.',
        category: 'Abstract',
        thumbnailUrl: 'https://picsum.photos/id/20/800/600',
        audio: true,
        video: false,
        tags: ['static', 'noise', 'pure'],
        audioUrl: '', // TODO: Add URL
        color: 'from-gray-200 to-gray-400',
        icon: '🌫️'
    },
    {
        id: 'env-12',
        title: 'Tropical Beach',
        description: 'Waves gently crashing on sand at sunset.',
        category: 'Nature',
        thumbnailUrl: 'https://picsum.photos/id/28/800/600',
        audio: true,
        video: true,
        tags: ['ocean', 'summer', 'sunset'],
        audioUrl: 'https://cdn.pixabay.com/download/audio/2025/08/17/audio_7f0f710ebf.mp3?filename=ocean-vibes-391210.mp3',
        videoUrl: 'https://cdn.pixabay.com/video/2025/10/12/309500_small.mp4',
        color: 'from-teal-400 to-blue-500',
        icon: '🏖️'
    }
];
