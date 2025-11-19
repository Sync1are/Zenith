import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogoIcon } from './icons/IconComponents';
import { useMessageStore } from '../store/useMessageStore';

const LoginPage: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Selectively subscribe to store (efficient)
    const login = useMessageStore((s) => s.login);
    const currentUser = useMessageStore((s) => s.currentUser);

    // Skip login if already logged in
    useEffect(() => {
        if (currentUser) {
            onLoginSuccess();
        }
    }, [currentUser, onLoginSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || isLoading) return;

        setIsLoading(true);

        try {
            await login(username);
        } catch (error) {
            console.error("Login error:", error);
            alert("Login failed.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#111217] relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="relative z-10 w-full max-w-md p-8"
            >
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                            <LogoIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Welcome to Zenith</h1>
                        <p className="text-gray-400 text-sm mt-2">Enter your identity to connect.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g. CyberPunk2077"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white 
                                           placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 
                                           focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                autoFocus
                                disabled={isLoading}
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={!username.trim() || isLoading}
                            className={`
                                w-full font-medium py-3 rounded-xl shadow-lg transition-all
                                ${isLoading
                                    ? 'bg-gray-600 cursor-wait text-gray-300'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'}
                            `}
                        >
                            {isLoading ? "Connecting..." : "Enter System"}
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
