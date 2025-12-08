import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogoIcon } from './icons/IconComponents';
import { useMessageStore } from '../store/useMessageStore';

interface SignUpPageProps {
    onNavigateToLogin: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigateToLogin }) => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [error, setError] = useState("");

    const signup = useMessageStore((s) => s.signup);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !username || !password || isLoading) return;

        setIsLoading(true);
        setError("");

        try {
            await signup(email, password, username);
            setVerificationSent(true);
        } catch (err: any) {
            console.error("Signup error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Email already in use.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError(err.message || "Signup failed.");
            }
            setIsLoading(false);
        }
    };

    if (verificationSent) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 w-full max-w-md p-8"
                >
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
                        <p className="text-gray-400 mb-8">
                            We've sent a verification link to <span className="text-white font-medium">{email}</span>.
                            Please check your inbox and click the link to activate your account.
                        </p>
                        <button
                            onClick={onNavigateToLogin}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-colors"
                        >
                            Return to Login
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

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
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                            <LogoIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Create Account</h1>
                        <p className="text-gray-400 text-sm mt-2">Join Lumen today.</p>
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
                                placeholder="Display Name"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white 
                                           placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 
                                           focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                disabled={isLoading}
                            />
                        </div>

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
                            disabled={isLoading}
                            className={`
                                w-full font-medium py-3 rounded-xl shadow-lg transition-all mt-4
                                ${isLoading
                                    ? 'bg-gray-600 cursor-wait text-gray-300'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'}
                            `}
                        >
                            {isLoading ? "Creating Account..." : "Sign Up"}
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

                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            Already have an account?{" "}
                            <button
                                onClick={onNavigateToLogin}
                                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                            >
                                Log In
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SignUpPage;
