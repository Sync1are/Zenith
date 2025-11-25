import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogoIcon } from './icons/IconComponents';
import { useMessageStore } from '../store/useMessageStore';

interface LoginPageProps {
    onLoginSuccess: () => void;
    onNavigateToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToSignup }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showGuestWarning, setShowGuestWarning] = useState(false);

    // Selectively subscribe to store (efficient)
    const login = useMessageStore((s) => s.login);
    const loginAsGuest = useMessageStore((s) => s.loginAsGuest);
    const currentUser = useMessageStore((s) => s.currentUser);

    // Skip login if already logged in
    useEffect(() => {
        if (currentUser) {
            onLoginSuccess();
        }
    }, [currentUser, onLoginSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || isLoading) return;

        setIsLoading(true);
        setError("");

        try {
            await login(email, password);
        } catch (error: any) {
            console.error("Login error:", error);
            let msg = "Login failed.";
            if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                msg = "Invalid email or password.";
            } else if (error.code === "auth/too-many-requests") {
                msg = "Too many failed attempts. Please try again later.";
            } else if (error.message) {
                msg = error.message;
            }
            setError(msg);
            setIsLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setShowGuestWarning(false);
        setIsLoading(true);
        setError("");

        try {
            await loginAsGuest();
        } catch (error: any) {
            console.error("Guest login error:", error);
            setError(error.message || "Guest login failed.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">

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
                        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
                        <p className="text-gray-400 text-sm mt-2">Enter your credentials to connect.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white 
                                           placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 
                                           focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                autoFocus
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white 
                                           placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 
                                           focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <p className="text-rose-400 text-sm text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
                                {error}
                            </p>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={!email || !password || isLoading}
                            className={`
                                w-full font-medium py-3 rounded-xl shadow-lg transition-all mt-4
                                ${isLoading
                                    ? 'bg-gray-600 cursor-wait text-gray-300'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'}
                            `}
                        >
                            {isLoading ? "Connecting..." : "Enter System"}
                        </motion.button>
                    </form>

                    <div className="mt-4 flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-xs text-gray-500 uppercase">Or continue with</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                            setIsLoading(true);
                            setError("");
                            try {
                                await useMessageStore.getState().loginWithGoogle();
                            } catch (err: any) {
                                console.error("Google login error:", err);
                                setError(err.message || "Google login failed.");
                                setIsLoading(false);
                            }
                        }}
                        disabled={isLoading}
                        className="w-full mt-4 bg-white text-gray-900 font-medium py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Google
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowGuestWarning(true)}
                        disabled={isLoading}
                        className="w-full mt-3 bg-gradient-to-r from-orange-500/20 to-indigo-600/20 border border-orange-500/30 text-white font-medium py-3 rounded-xl hover:from-orange-500/30 hover:to-indigo-600/30 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Continue as Guest
                    </motion.button>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            Don't have an account?{" "}
                            <button
                                onClick={onNavigateToSignup}
                                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                            >
                                Sign Up
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Guest Warning Modal */}
            {showGuestWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Guest Account Warning</h3>
                        </div>

                        <p className="text-gray-300 mb-6 leading-relaxed">
                            Your guest account will be <span className="text-orange-400 font-semibold">permanently deleted</span> when you log out.
                            All data, tasks, and messages will be lost.
                        </p>

                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowGuestWarning(false)}
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 rounded-lg transition-colors border border-white/10"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGuestLogin}
                                className="flex-1 bg-gradient-to-r from-orange-500 to-indigo-600 hover:from-orange-600 hover:to-indigo-700 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-orange-500/20"
                            >
                                I Understand
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
