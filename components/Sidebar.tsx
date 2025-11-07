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

const navItems = [
  { label: "Dashboard", icon: <DashboardIcon className="h-6 w-6" /> },
  { label: "Tasks", icon: <TasksIcon className="h-6 w-6" /> },
  { label: "Calendar", icon: <CalendarIcon className="h-6 w-6" /> },
  { label: "Focus", icon: <FocusIcon className="h-6 w-6" /> },
  { label: "Analytics", icon: <AnalyticsIcon className="h-6 w-6" /> },
  { label: "Settings", icon: <SettingsIcon className="h-6 w-6" /> }
];

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompactMode] = useState(false);

  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlight, setHighlight] = useState({ top: 0, height: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const index = navItems.findIndex((i) => i.label === activeItem);
    const btn = btnRefs.current[index];

    if (btn) {
      const { offsetTop, offsetHeight } = btn;
      setHighlight({ top: offsetTop, height: offsetHeight });
      setReady(true);
    }
  }, [activeItem, isExpanded]);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.position = "absolute";
    ripple.style.borderRadius = "50%";
    ripple.style.background = "rgba(255,255,255,0.25)";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    ripple.style.transform = "scale(0)";
    ripple.style.opacity = "1";
    ripple.style.animation = "ripple-effect 600ms ease-out";
    ripple.style.pointerEvents = "none";

    button.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  };

  return (
    <aside
      onMouseEnter={() => !isCompactMode && setIsExpanded(true)}
      onMouseLeave={() => !isCompactMode && setIsExpanded(false)}
      className={`
        hidden md:flex flex-col
        bg-[#1C1C1E]/80 backdrop-blur-xl border border-[#2A2A2E]
        shadow-[0_8px_30px_rgba(0,0,0,0.45)]
        rounded-xl ml-4 mt-3 mb-4 p-4 transition-all duration-300 z-10
        ${isExpanded && !isCompactMode ? "w-64" : "w-20"}
      `}
    >

      {/* Logo */}
      <div className="flex items-center text-white px-2 mb-6">
        <LogoIcon className="h-9 w-9" />
        <span
          className={`text-2xl font-bold whitespace-nowrap overflow-hidden transition-all duration-300
          ${isExpanded ? "opacity-100 ml-3 w-32" : "opacity-0 ml-0 w-0"}`}
        >
          Zenith
        </span>
      </div>

      {/* Nav */}
      <nav className="relative flex flex-col flex-1 space-y-2 overflow-hidden">

        {/* Highlight */}
        {ready && (
          <div
            className="absolute left-0 right-0 bg-indigo-600 rounded-lg transition-transform duration-300"
            style={{
              height: highlight.height,
              transform: `translateY(${highlight.top}px)`
            }}
          />
        )}

        {navItems.map((item, index) => (
          <button
            key={item.label}
            ref={(el) => (btnRefs.current[index] = el)}
            onClick={(e) => {
              createRipple(e);
              onSelect(item.label);
            }}
            className={`
              relative flex items-center w-full px-3 py-3 rounded-lg overflow-hidden
              transition-colors duration-200 z-10
              ${
                activeItem === item.label
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              }
              ${!isExpanded && "justify-center"}
            `}
          >
            {item.icon}
            <span
              className={`font-medium whitespace-nowrap transition-all duration-300
              ${isExpanded ? "opacity-100 ml-4 w-32" : "opacity-0 ml-0 w-0"}`}
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
