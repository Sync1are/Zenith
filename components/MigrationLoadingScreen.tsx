import React from 'react';

interface MigrationLoadingScreenProps {
    isVisible: boolean;
}

const MigrationLoadingScreen: React.FC<MigrationLoadingScreenProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-12 max-w-md w-full mx-4 shadow-2xl">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-white/20 border-t-[var(--accent)] animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                                className="w-10 h-10 text-[var(--accent)]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Migrating Data</h2>
                    <p className="text-white/70 text-sm">
                        Syncing your data to cloud storage...
                    </p>
                    <p className="text-white/50 text-xs mt-2">
                        This will only take a moment
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mt-8 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-500 rounded-full animate-pulse"
                        style={{
                            animation: 'pulse 1.5s ease-in-out infinite, shimmer 2s linear infinite',
                            backgroundSize: '200% 100%',
                        }}
                    />
                </div>
            </div>

            <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
        </div>
    );
};

export default MigrationLoadingScreen;
