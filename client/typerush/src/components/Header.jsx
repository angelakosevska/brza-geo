import { useState, useEffect } from "react";
import { UserRound, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import GlassCard from "./GlassCard";

export default function Header() {
  const [username, setUsername] = useState("User");
  const [theme, setTheme] = useState("system"); // "light" | "dark" | "system"
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) setUsername(stored);

    const savedTheme = localStorage.getItem("theme") || "system";
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (mode) => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else if (mode === "light") {
      root.classList.remove("dark");
    } else {
      // "system" → чисти и препушти на @media
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", mode);
    setTheme(mode);
  };

  return (
    <GlassCard className="p-4 w-[90vw] max-h-25 align-middle">
      <div className="flex justify-between items-center w-full">
        {/* Logo + Title */}
        <div className="flex items-center gap-2">
          <img
            src="/tr1.svg"
            alt="Type Rush Logo"
            className="w-12 h-12 blink-cursor"
          />
          <span
            className="font-black text-[var(--primary)] text-3xl uppercase leading-none cursor-pointer"
            onClick={() => navigate("/main")}
          >
            TYPE RUSH
          </span>
        </div>

        {/* Profile DropdownMenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <UserRound className="w-10 h-10 text-[var(--primary)] cursor-pointer" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="justify-end bg-[var(--background)]/30 shadow-gray-500/20 shadow-xl backdrop-blur-sm mt-2 border border-[var(--background)] rounded-3xl w-auto min-w-[20vw]"
          >
            <div className="flex items-center gap-2 px-2 py-2">
              <UserRound className="w-7 h-7 text-[var(--primary)]" />
              <span className="font-semibold text-[var(--text)] text-md lg:text-lg">
                {username}
              </span>
            </div>
            <DropdownMenuSeparator />

            {/* Theme switcher */}
            <DropdownMenuItem
              onClick={() => applyTheme("light")}
              className="flex items-center gap-2 text-[var(--text)] text-md lg:text-lg cursor-pointer"
            >
              <Sun className="w-5 h-5 text-[var(--primary)]" />
              Светла тема {theme === "light" && "✓"}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => applyTheme("dark")}
              className="flex items-center gap-2 text-[var(--text)] text-md lg:text-lg cursor-pointer"
            >
              <Moon className="w-5 h-5 text-[var(--primary)]" />
              Темна тема {theme === "dark" && "✓"}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => applyTheme("system")}
              className="flex items-center gap-2 text-[var(--text)] text-md lg:text-lg cursor-pointer"
            >
              <Monitor className="w-5 h-5 text-[var(--primary)]" />
              Автоматска {theme === "system" && "✓"}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/40 mx-auto border-0 w-[95%] h-px" />

            <DropdownMenuItem
              onClick={() => {
                localStorage.clear();
                navigate("/auth");
              }}
              className="flex items-center gap-2 font-bold text-md lg:text-lg cursor-pointer"
            >
              <LogOut className="w-5 h-5 text-[var(--accent)]" />
              <span className="text-[var(--accent)]">Одлогирај се</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </GlassCard>
  );
}
