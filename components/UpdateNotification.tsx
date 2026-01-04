import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle, AlertCircle } from 'lucide-react';

type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';

interface UpdateInfo {
    version?: string;
    releaseDate?: string;
    releaseNotes?: string;
}

const UpdateNotification: React.FC = () => {
    const [updateState, setUpdateState] = useState<UpdateState>('idle');
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({});
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if running in Electron
        if (!window.electronAPI) return;

        // Listen to update events from main process
        window.electronAPI.onUpdateChecking(() => {
            setUpdateState('checking');
            setDismissed(false);
        });

        window.electronAPI.onUpdateAvailable((data: any) => {
            setUpdateState('available');
            setUpdateInfo({
                version: data.version,
                releaseDate: data.releaseDate,
                releaseNotes: data.releaseNotes
            });
            setDismissed(false);
        });

        window.electronAPI.onUpdateNotAvailable(() => {
            setUpdateState('idle');
        });

        window.electronAPI.onUpdateDownloadProgress((data: any) => {
            setUpdateState('downloading');
            setDownloadProgress(Math.round(data.percent));
        });

        window.electronAPI.onUpdateDownloaded((data: any) => {
            setUpdateState('downloaded');
            setUpdateInfo(prev => ({ ...prev, version: data.version }));
        });

        window.electronAPI.onUpdateError((data: any) => {
            setUpdateState('error');
            // Parse error message for common issues
            let friendlyMessage = data.message;
            if (data.message.includes('404') && data.message.includes('releases.atom')) {
                friendlyMessage = "Cannot access updates. Repository might be private.";
            } else if (data.message.includes('net::ERR_INTERNET_DISCONNECTED')) {
                friendlyMessage = "No internet connection. Cannot check for updates.";
            }
            setErrorMessage(friendlyMessage);
        });

        return () => {
            // Cleanup listeners
            window.electronAPI?.removeUpdateListeners();
        };
    }, []);

    const handleDownload = () => {
        window.electronAPI?.downloadUpdate();
    };

    const handleInstall = () => {
        window.electronAPI?.installUpdate();
    };

    const handleDismiss = () => {
        setDismissed(true);
    };

    const shouldShow = !dismissed && ['available', 'downloading', 'downloaded', 'error'].includes(updateState);

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    initial={{ opacity: 0, y: -100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-[500px]"
                >
                    <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                                {updateState === 'error' ? (
                                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5 text-red-400" />
                                    </div>
                                ) : updateState === 'downloaded' ? (
                                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                        <Download className="w-5 h-5 text-indigo-400" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-sm mb-1">
                                    {updateState === 'error' ? 'Update Error' :
                                        updateState === 'downloaded' ? 'Update Ready!' :
                                            updateState === 'downloading' ? 'Downloading Update...' :
                                                'Update Available'}
                                </h3>

                                {updateState === 'error' ? (
                                    <p className="text-white/60 text-xs">{errorMessage}</p>
                                ) : updateState === 'downloaded' ? (
                                    <p className="text-white/60 text-xs">
                                        Version {updateInfo.version} is ready to install. Click "Restart Now" to update.
                                    </p>
                                ) : updateState === 'downloading' ? (
                                    <>
                                        <p className="text-white/60 text-xs mb-2">Downloading version {updateInfo.version}...</p>
                                        {/* Progress Bar */}
                                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${downloadProgress}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                        <p className="text-white/40 text-[10px] mt-1">{downloadProgress}%</p>
                                    </>
                                ) : (
                                    <p className="text-white/60 text-xs">
                                        Version {updateInfo.version} is now available. Click "Download" to update.
                                    </p>
                                )}

                                {/* Buttons */}
                                {updateState === 'available' && (
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={handleDownload}
                                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            Download Now
                                        </button>
                                        <button
                                            onClick={handleDismiss}
                                            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            Later
                                        </button>
                                    </div>
                                )}

                                {updateState === 'downloaded' && (
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={handleInstall}
                                            className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            Restart Now
                                        </button>
                                        <button
                                            onClick={handleDismiss}
                                            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            Later
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={handleDismiss}
                                className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-white/60" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UpdateNotification;
