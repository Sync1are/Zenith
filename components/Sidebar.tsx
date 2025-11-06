import React, { useState, useRef, useLayoutEffect } from "react";
import {
  LogoIcon,
  DashboardIcon,
  TasksIcon,
  CalendarIcon,
  FocusIcon,
  AnalyticsIcon,
  SettingsIcon
} from "./icons/IconComponents";

interface SidebarProps {
  activeItem: string;
  onSelect: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { label: "Dashboard", icon: <DashboardIcon className="h-6 w-6" /> },
    { label: "Tasks", icon: <TasksIcon className="h-6 w-6" /> },
    { label: "Calendar", icon: <CalendarIcon className="h-6 w-6" /> },
    { label: "Focus", icon: <FocusIcon className="h-6 w-6" /> },
    { label: "Analytics", icon: <AnalyticsIcon className="h-6 w-6" /> },
    { label: "Settings", icon: <SettingsIcon className="h-6 w-6" /> }
  ];

  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlight, setHighlight] = useState({ top: 0, height: 0 });
  const [ready, setReady] = useState(false);
  const [hasAnimatedOnce, setHasAnimatedOnce] = useState(false);

  useLayoutEffect(() => {
    const index = navItems.findIndex((i) => i.label === activeItem);
    const btn = btnRefs.current[index];
    if (btn) {
      setHighlight({
        top: btn.offsetTop,
        height: btn.offsetHeight,
      });
      setReady(true);

      setTimeout(() => setHasAnimatedOnce(true), 10); // Prevent initial pop-in
    }
  }, [activeItem, isExpanded]);

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement("span");

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.position = "absolute";
    ripple.style.borderRadius = "50%";
    ripple.style.background = "rgba(255,255,255,0.25)";
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    ripple.style.pointerEvents = "none";
    ripple.style.transform = "scale(0)";
    ripple.style.opacity = "1";
    ripple.style.animation = "ripple-effect 600ms ease-out";

    button.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  };

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#1C1C1E] p-4 border-r border-gray-800 transition-all duration-300 ${
        isExpanded ? "w-64" : "w-24"
      } relative overflow-hidden`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center text-white px-2 mb-6">
        <LogoIcon className="h-9 w-9" />
        <span
          className={`text-2xl font-bold overflow-hidden transition-all duration-200 ${
            isExpanded ? "w-32 ml-3 opacity-100" : "w-0 ml-0 opacity-0"
          }`}
        >
          Zenith
        </span>
      </div>

      {/* Navigation */}
      <nav className="relative flex flex-col space-y-3 flex-1">

        {/* Animated Highlight */}
        {ready && (
          <div
            className={`absolute left-0 right-0 bg-indigo-600 rounded-lg will-change-transform ${
              hasAnimatedOnce
                ? "transition-transform duration-300 ease-[cubic-bezier(.25,.8,.25,1)]"
                : "transition-none"
            }`}
            style={{
              height: highlight.height,
              transform: `translateY(${highlight.top}px)`
            }}
          />
        )}

        {/* Buttons */}
        {navItems.map((item, i) => (
          <button
            key={item.label}
            ref={(el) => (btnRefs.current[i] = el)}
            onClick={(e) => {
              handleRipple(e);
              onSelect(item.label);
            }}
            className={`relative overflow-hidden flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${
              activeItem === item.label
                ? "text-white"
                : "text-gray-400 hover:text-white"
            } ${!isExpanded && "justify-center"}`}
          >
            {item.icon}
            <span
              className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                isExpanded ? "w-32 ml-4 opacity-100" : "w-0 ml-0 opacity-0"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
