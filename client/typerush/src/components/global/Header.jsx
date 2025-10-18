import {
  UserRound,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import GlassCardHeader from "./GlassCardHeader";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

export default function Header() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState("system");
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin/review-panel");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // Only listen to system changes if theme = "system"
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (localStorage.getItem("theme") === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const applyTheme = (mode) => {
    const root = document.documentElement;

    if (mode === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } else if (mode === "dark") {
      root.classList.add("dark"); // force dark
    } else {
      root.classList.remove("dark"); // force light
    }

    localStorage.setItem("theme", mode);
    setTheme(mode);
  };

  const ThemeItem = ({ mode, icon: Icon, label }) => (
    <DropdownMenuItem
      onClick={() => applyTheme(mode)}
      className={`flex items-center justify-between gap-2 text-md lg:text-lg cursor-pointer hover:bg-[var(--secondary)]/20 ${
        theme === mode
          ? "text-[var(--primary)] font-semibold"
          : "text-[var(--text)]"
      }`}
    >
      <div className="group flex items-center gap-2">
        <Icon className="w-5 h-5 text-[var(--text)] group-hover:text-[var(--secondary)]" />
        <span className="group-hover:text-[var(--secondary)]">{label}</span>
      </div>
      {theme === mode && <Check className="w-4 h-4 text-[var(--primary)]" />}
    </DropdownMenuItem>
  );

  return (
    <GlassCardHeader className="z-50 mt-2 max-h-25 align-middle mx-auto">
      <div className="flex justify-between items-center align-middle w-full mx-auto">
        {/* Logo + Title */}
        <div className="flex items-center gap-2">
          <img
            src="/tr1.svg"
            alt="Type Rush Logo"
            className="w-12 h-12 blink-cursor"
            onClick={() => navigate("/invitation")}
          />
          <span
            onClick={() => navigate("/main")}
            className="font-black text-[var(--primary)] text-3xl uppercase leading-none cursor-pointer"
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
            className="bg-[var(--background)]/30 shadow-gray-500/20 shadow-xl backdrop-blur-sm mt-2 p-4 border border-[var(--background)] rounded-3xl w-auto min-w-[20vw]"
          >
            {/* Username */}
            <div className="flex items-center gap-2 px-2 py-2">
              <UserRound className="w-7 h-7 text-[var(--primary)]" />
              <span className="font-semibold text-[var(--text)] text-md lg:text-lg">
                {user?.username || "Корисник"}
              </span>
            </div>

            {/* Admin Panel link (only for admins) */}
            {user?.role === "admin" && (
              <DropdownMenuItem
                onClick={() => navigate("/admin/review-panel")}
                className={`flex items-center gap-2 text-md lg:text-lg cursor-pointer group
      ${
        isAdminPage
          ? "bg-[var(--secondary)]/20 text-[var(--secondary)]"
          : "hover:bg-[var(--secondary)]/20"
      }
    `}
              >
                <ShieldCheck
                  className={`w-5 h-5 ${
                    isAdminPage
                      ? "text-[var(--secondary)]"
                      : "text-[var(--primary)] group-hover:text-[var(--secondary)]"
                  }`}
                />
                <span
                  className={`${
                    isAdminPage
                      ? "text-[var(--secondary)]"
                      : "text-[var(--text)] group-hover:text-[var(--secondary)]"
                  }`}
                >
                  Админ панел
                </span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-[var(--glass)]/5 mx-auto border-0 w-[95%] h-px" />

            {/* Theme switcher */}
            <ThemeItem mode="light" icon={Sun} label="Светла тема" />
            <ThemeItem mode="dark" icon={Moon} label="Темна тема" />
            <ThemeItem mode="system" icon={Monitor} label="Автоматска" />

            <DropdownMenuSeparator className="bg-[var(--glass)]/5 mx-auto border-0 w-[95%] h-px" />

            {/* Logout */}
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate("/auth");
              }}
              className="group flex items-center gap-2 hover:bg-[var(--secondary)]/20 font-bold text-md lg:text-lg cursor-pointer"
            >
              <LogOut className="w-5 h-5 text-[var(--accent)] group-hover:text-[var(--secondary)]" />
              <span className="text-[var(--accent)] group-hover:text-[var(--secondary)]">
                Одјави се
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </GlassCardHeader>
  );
}
