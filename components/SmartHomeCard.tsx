import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import SpotifyCard from "./SpotifyCard";
import { useAppStore } from "../store/useAppStore";
import { useMessageStore } from "../store/useMessageStore";
import { Cloud, CloudRain, Sun, Moon, Wind, Droplets, MapPin } from 'lucide-react';

// --- Types for Weather Card ---
enum DayPhase {
    DAWN = "Dawn",
    DAY = "Day",
    DUSK = "Dusk",
    NIGHT = "Night",
}

interface WeatherData {
    temperature: string;
    condition: string;
    location: string;
    humidity: string;
    wind: string;
}

// --- Integrated SunMoonArc Component ---

interface SunMoonArcProps {
    progress: number; // 0 to 1 representing position on arc
    phase: DayPhase;
}

const SunMoonArc: React.FC<SunMoonArcProps> = ({ progress, phase }) => {
    // Dimensions tailored for the 350px width card
    const width = 350;
    const height = 80;

    // Bezier Curve Control Points
    // Adjusted for a wider, flatter arc to fit in 140px height
    // P0 (Start), P1 (Control), P2 (End)
    const p0 = { x: 30, y: 65 };
    const p1 = { x: 175, y: -10 };
    const p2 = { x: 320, y: 65 };

    // Calculate position on Quadratic Bezier Curve
    const getPosition = (t: number) => {
        const clampedT = Math.max(0, Math.min(1, t));
        const oneMinusT = 1 - clampedT;

        const x = Math.pow(oneMinusT, 2) * p0.x + 2 * oneMinusT * clampedT * p1.x + Math.pow(clampedT, 2) * p2.x;
        const y = Math.pow(oneMinusT, 2) * p0.y + 2 * oneMinusT * clampedT * p1.y + Math.pow(clampedT, 2) * p2.y;

        return { x, y };
    };

    const { x, y } = getPosition(progress);
    const isNight = phase === DayPhase.NIGHT;

    return (
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center pointer-events-none">
            {/* Container matching SVG size */}
            <div className="relative select-none" style={{ width, height }}>

                {/* The Track Path */}
                <svg width={width} height={height} className="absolute inset-0 overflow-visible block">
                    <defs>
                        <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                            <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                        </linearGradient>
                    </defs>

                    {/* Dotted Horizon Line */}
                    <line
                        x1={p0.x} y1={p0.y} x2={p2.x} y2={p2.y}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                    />

                    {/* The Arc */}
                    <path
                        d={`M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
                        fill="none"
                        stroke="url(#arcGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>

                {/* The Celestial Body Wrapper - Positioned at X,Y */}
                <div
                    className="absolute top-0 left-0 z-30 will-change-transform"
                    style={{
                        transform: `translate3d(${x}px, ${y}px, 0)`,
                    }}
                >
                    {/* 
             Centering Wrapper: 
             Translate -50% -50% ensures the center of the sphere aligns exactly with the path coordinate (x,y).
          */}
                    <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">

                        {/* 1. Outer Glow (Halo) - Scaled down for smaller card */}
                        <div className="relative w-20 h-20">
                            <div className={`absolute inset-0 rounded-full blur-lg transition-opacity duration-1000 ${isNight ? 'bg-blue-300/30 opacity-100' : 'opacity-0'}`} />
                            <div className={`absolute inset-0 rounded-full blur-lg transition-opacity duration-1000 ${!isNight ? 'bg-orange-400/40 opacity-100' : 'opacity-0'}`} />
                        </div>

                        {/* 2. The Solid Sphere - Resized to w-10 h-10 (40px) */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg transition-all duration-1000 overflow-hidden
                ${isNight
                                ? 'ring-1 ring-slate-300 shadow-slate-900/50'
                                : 'ring-1 ring-orange-200 shadow-orange-700/50'
                            }
            `}>
                            {/* --- SUN FACE --- */}
                            <div className={`absolute inset-0 transition-opacity duration-1000 ${!isNight ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="absolute inset-0 bg-orange-400" /> {/* Base */}
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-orange-400 to-red-500" />
                                <div className="absolute top-1.5 left-1.5 w-3 h-2 bg-white/50 blur-[1.5px] rounded-full -rotate-45" />
                            </div>

                            {/* --- MOON FACE --- */}
                            <div className={`absolute inset-0 transition-opacity duration-1000 ${isNight ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="absolute inset-0 bg-slate-200" /> {/* Base */}
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500" />
                                {/* Tiny Craters */}
                                <div className="absolute top-2 left-2 w-2 h-2 bg-slate-400/40 rounded-full shadow-inner" />
                                <div className="absolute bottom-3 right-2 w-1.5 h-1.5 bg-slate-400/40 rounded-full shadow-inner" />
                            </div>

                        </div>
                    </div>
                </div>

                {/* Labels - Adjusted position */}

            </div>
        </div>
    );
};

// --- Main WeatherCard Component ---

interface WeatherCardProps {
    weather: WeatherData | null;
    loading: boolean;
    time: Date;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, loading, time }) => {

    // Calculate Phase and Progress
    const { phase, progress } = useMemo(() => {
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const totalMinutes = hours * 60 + minutes;

        // Define approximate cycle times
        const t = (h: number, m: number = 0) => h * 60 + m;

        let p = 0;
        let ph = DayPhase.DAY;

        // Dawn: 05:00 - 07:00
        // Day: 07:00 - 18:00
        // Dusk: 18:00 - 20:00
        // Night: 20:00 - 05:00

        if (totalMinutes >= t(5) && totalMinutes < t(7)) {
            ph = DayPhase.DAWN;
            p = (totalMinutes - t(5)) / (t(7) - t(5)) * 0.15; // 0 to 0.15
        } else if (totalMinutes >= t(7) && totalMinutes < t(18)) {
            ph = DayPhase.DAY;
            p = 0.15 + ((totalMinutes - t(7)) / (t(18) - t(7)) * 0.7); // 0.15 to 0.85
        } else if (totalMinutes >= t(18) && totalMinutes < t(20)) {
            ph = DayPhase.DUSK;
            p = 0.85 + ((totalMinutes - t(18)) / (t(20) - t(18)) * 0.15); // 0.85 to 1.0
        } else {
            ph = DayPhase.NIGHT;
            // Night logic: 20:00 to 05:00
            if (totalMinutes >= t(20)) {
                // 20:00 to 24:00
                const nightDuration = 9 * 60; // 9 hours
                const elapsed = totalMinutes - t(20);
                p = elapsed / nightDuration;
            } else {
                // 00:00 to 05:00
                const nightDuration = 9 * 60;
                const elapsed = (24 * 60 - t(20)) + totalMinutes;
                p = elapsed / nightDuration;
            }
        }

        return { phase: ph, progress: p };
    }, [time]);

    // Map phases to their specific gradient classes
    const phaseGradients: Record<DayPhase, string> = {
        [DayPhase.DAWN]: 'bg-gradient-to-br from-[#6366F1] via-[#F472B6] to-[#FCD34D]', // Indigo -> Pink -> Amber
        [DayPhase.DAY]: 'bg-gradient-to-br from-[#38BDF8] via-[#60A5FA] to-[#818CF8]', // Sky -> Blue -> Indigo
        [DayPhase.DUSK]: 'bg-gradient-to-br from-[#4F46E5] via-[#A855F7] to-[#F97316]', // Indigo -> Purple -> Orange
        [DayPhase.NIGHT]: 'bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81]', // Dark Slate -> Deep Indigo
    };

    return (
        <div className="relative w-full h-[140px] rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden text-white transition-all duration-1000 ease-in-out col-span-2">

            {/* 
        Background Layers for Smooth Transitions 
      */}
            {Object.values(DayPhase).map((p) => (
                <div
                    key={p}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${phaseGradients[p]} ${phase === p ? 'opacity-100' : 'opacity-0'
                        }`}
                />
            ))}

            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-15 mix-blend-soft-light bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none z-0"></div>

            {/* Glassy Shine */}
            <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-0" />

            {/* Main Content Container */}
            <div className="relative z-10 w-full h-full p-5 flex flex-col justify-between">

                {/* Top Section: Temp (Left) & Info (Right) */}
                <div className="flex justify-between items-start">

                    {/* Left: Temperature only */}
                    <div className="flex flex-col">
                        <span className="text-5xl font-light tracking-tighter drop-shadow-md leading-none ml-[-4px]">
                            {weather ? weather.temperature.replace('°C', '°') : "--°"}
                        </span>
                    </div>

                    {/* Right: Location (was Time), Condition, Phase */}
                    <div className="flex flex-col items-end text-right">
                        {/* City Name replacing Time */}
                        <span className="text-lg font-bold tracking-tight opacity-95 truncate max-w-[160px] drop-shadow-sm">
                            {weather?.location || "Locating..."}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">{phase}</span>
                        <span className="text-xs font-medium opacity-80">{weather?.condition || "Clear"}</span>
                    </div>
                </div>

                {/* The Arc Visualization - Absolute Bottom Layer */}
                <SunMoonArc progress={progress} phase={phase} />

                {/* Bottom Section: Stats Badges (Overlaying the background) */}
                <div className="flex justify-between items-end z-20 mt-auto">
                    {/* Humidity */}
                    <div className="bg-black/10 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5 border border-white/5 shadow-sm">
                        <Droplets className="w-3 h-3 opacity-70" />
                        <span className="text-xs font-medium">{weather?.humidity || '--%'}</span>
                    </div>

                    {/* Wind */}
                    <div className="bg-black/10 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5 border border-white/5 shadow-sm">
                        <Wind className="w-3 h-3 opacity-70" />
                        <span className="text-xs font-medium">{weather?.wind ? weather.wind.replace('km/h', '') : '--'} <span className="text-[9px] opacity-70">km/h</span></span>
                    </div>
                </div>

                {loading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SmartHomeCard: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    // Mock weather data for the new card
    const [weatherData, setWeatherData] = useState<WeatherData>({
        temperature: "24°C",
        condition: "Partly Cloudy",
        location: "San Francisco",
        humidity: "65%",
        wind: "12 km/h"
    });
    const currentUser = useMessageStore((s) => s.currentUser);
    const calendarEvents = useAppStore((s) => s.calendarEvents) || [];
    const tasks = useAppStore((s) => s.tasks) || [];

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    // Get today's events
    const getTodayEvents = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return calendarEvents.filter((event) => {
            const eventDate = new Date(event.start);
            return eventDate >= today && eventDate < tomorrow;
        }).slice(0, 3);
    };

    const todayEvents = getTodayEvents();

    // Get week days centered on today
    const getWeekDays = () => {
        const days = [];
        for (let i = -3; i <= 3; i++) {
            const d = new Date(currentTime);
            d.setDate(currentTime.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays();

    return (
        <div className="w-full max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto px-4 sm:px-6 pb-6 pt-0">
            <style>{`
        .smart-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
        }
        
        .info-box {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        
        .info-box:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        
        .toggle-switch {
          width: 48px;
          height: 28px;
          background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
          border-radius: 14px;
          position: relative;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(255, 107, 53, 0.4);
        }
        
        .toggle-dot {
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 4px;
          right: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>

            <div className="smart-card rounded-3xl p-4 sm:p-5 flex flex-col">
                {/* Header with Greeting */}
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white">Hi {currentUser?.username || "User"}</h2>
                        <p className="text-sm text-white/50">Welcome Home</p>
                    </div>
                    {currentUser?.avatar ? (
                        <img
                            src={currentUser.avatar}
                            alt={currentUser.username}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold">
                            {currentUser?.username?.[0]?.toUpperCase() || "U"}
                        </div>
                    )}
                </div>

                {/* Spotify Player */}
                <div className="mb-4 flex-shrink-0">
                    <SpotifyCard />
                </div>

                {/* Grid of Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-shrink-0">
                    {/* Time Card */}
                    <motion.div
                        className="info-box p-4 col-span-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
                                    Current Time
                                </p>
                                <p className="text-white text-4xl font-bold tracking-tight tabular-nums">
                                    {formatTime(currentTime)}
                                </p>
                                <p className="text-white/60 text-sm mt-2 font-medium">
                                    {formatDate(currentTime)}
                                </p>
                            </div>
                            <div className="relative w-16 h-16 opacity-80">
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    {/* Clock face */}
                                    <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

                                    {/* Hour markers */}
                                    {[...Array(12)].map((_, i) => {
                                        const angle = (i * 30 - 90) * (Math.PI / 180);
                                        const x1 = 50 + 38 * Math.cos(angle);
                                        const y1 = 50 + 38 * Math.sin(angle);
                                        const x2 = 50 + 42 * Math.cos(angle);
                                        const y2 = 50 + 42 * Math.sin(angle);
                                        return (
                                            <line
                                                key={i}
                                                x1={x1}
                                                y1={y1}
                                                x2={x2}
                                                y2={y2}
                                                stroke="rgba(255,255,255,0.5)"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                            />
                                        );
                                    })}

                                    {/* Hour hand */}
                                    <line
                                        x1="50"
                                        y1="50"
                                        x2={50 + 25 * Math.sin((currentTime.getHours() % 12 + currentTime.getMinutes() / 60) * 30 * (Math.PI / 180))}
                                        y2={50 - 25 * Math.cos((currentTime.getHours() % 12 + currentTime.getMinutes() / 60) * 30 * (Math.PI / 180))}
                                        stroke="rgba(255,255,255,0.9)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />

                                    {/* Minute hand */}
                                    <line
                                        x1="50"
                                        y1="50"
                                        x2={50 + 35 * Math.sin((currentTime.getMinutes() + currentTime.getSeconds() / 60) * 6 * (Math.PI / 180))}
                                        y2={50 - 35 * Math.cos((currentTime.getMinutes() + currentTime.getSeconds() / 60) * 6 * (Math.PI / 180))}
                                        stroke="rgba(255,255,255,0.9)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />

                                    {/* Second hand */}
                                    <line
                                        x1="50"
                                        y1="50"
                                        x2={50 + 38 * Math.sin(currentTime.getSeconds() * 6 * (Math.PI / 180))}
                                        y2={50 - 38 * Math.cos(currentTime.getSeconds() * 6 * (Math.PI / 180))}
                                        stroke="rgba(249, 115, 22, 0.8)"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />

                                    {/* Center dot */}
                                    <circle cx="50" cy="50" r="3" fill="rgba(255,255,255,0.9)" />
                                </svg>
                            </div>
                        </div>
                    </motion.div>

                    {/* Today's Events Card */}
                    {todayEvents.length > 0 && (
                        <motion.div
                            className="info-box p-4 col-span-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">
                                Today's Events
                            </p>
                            <div className="space-y-2">
                                {todayEvents.map((event) => {
                                    const eventTime = new Date(event.start).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                    });
                                    return (
                                        <div key={event.id} className="flex items-center gap-2 text-sm">
                                            <div className={`w-2 h-2 rounded-full bg-${event.category === 'work' ? 'orange' : event.category === 'personal' ? 'purple' : 'blue'}-400`} />
                                            <span className="text-white/50 text-xs">{eventTime}</span>
                                            <span className="text-white/80 flex-1 truncate">{event.title}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Weather Card */}
                    <WeatherCard weather={weatherData} loading={false} time={currentTime} />

                    {/* Date Card - Redesigned Calendar */}
                    <motion.div
                        className="info-box col-span-2 overflow-hidden relative"
                        whileHover={{ scale: 1.01 }}
                    >
                        <div className="p-5 relative z-10 flex flex-col justify-between h-full">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-white text-3xl font-light tracking-wide">
                                    {currentTime.toLocaleDateString("en-US", { month: "long" })}
                                </h3>
                                <span className="text-white text-3xl font-light">
                                    {currentTime.getDate()}
                                </span>
                            </div>

                            {/* Week Row */}
                            <div className="relative mb-4">
                                {/* Curved Background Effect */}
                                <div className="absolute top-1/2 left-[-20px] right-[-20px] h-12 bg-white/5 rounded-[100%] blur-xl -z-10 transform -translate-y-1/2 pointer-events-none"></div>

                                <div className="flex justify-between items-center px-1">
                                    {weekDays.map((date, index) => {
                                        const isToday = date.getDate() === currentTime.getDate();
                                        return (
                                            <div key={index} className="flex flex-col items-center gap-2">
                                                <span className="text-white/60 text-[10px] font-medium uppercase tracking-wider">
                                                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                                                </span>
                                                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all ${isToday
                                                    ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110"
                                                    : "text-white hover:bg-white/10"
                                                    }`}>
                                                    {date.getDate()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                <button className="flex items-center gap-2 text-white/60 hover:text-white text-xs transition-colors group">
                                    <span className="text-sm group-hover:scale-110 transition-transform">✎</span>
                                    <span>Add a note...</span>
                                </button>

                                <button className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all backdrop-blur-sm border border-white/10">
                                    <span className="text-xs">+</span> New Event
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Smart Light Control Card */}
                    <motion.div
                        className="info-box p-4"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex flex-col h-full justify-between">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
                                    Focus
                                </p>
                                <span className="text-2xl">💡</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-semibold mb-2">Deep Work</p>
                                <div className="toggle-switch">
                                    <div className="toggle-dot" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Remaining Tasks Card */}
                    <motion.div
                        className="info-box p-4"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex flex-col h-full justify-between">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
                                    Tasks
                                </p>
                                <span className="text-2xl">📝</span>
                            </div>
                            <div>
                                {tasks.filter(t => t.status !== 'completed').length > 0 ? (
                                    <div className="space-y-1">
                                        <p className="text-white/50 text-xs mb-1">remaining tasks</p>
                                        <p className="text-white text-2xl font-bold mb-1">
                                            {tasks.filter(t => t.status !== 'completed').length}
                                        </p>
                                        <p className="text-white/50 text-xs">
                                            {tasks.filter(t => t.status !== 'completed').slice(0, 1).map(task => task.title).join(', ') || 'remaining'}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-white text-lg font-bold mb-1">All Done!</p>
                                        <p className="text-white/50 text-xs">No pending tasks</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>


            </div>
        </div>
    );
};

export default SmartHomeCard;
