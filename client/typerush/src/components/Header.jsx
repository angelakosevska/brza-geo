import { useState, useEffect } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) setUsername(stored);
  }, []);

  return (
    <>
      <GlassCard className="p-4 w-[90vw] max-h-25 align-middle">
        <div className="flex justify-between items-center w-full">
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
              className="bg-[var(--background)]/30 shadow-gray-500/20 shadow-xl backdrop-blur-sm mt-2 border border-[var(--background)] rounded-3xl w-auto min-w-[20vw]"
            >
              <div className="flex items-center gap-2 px-2 py-2">
                <UserRound className="w-7 h-7 text-[var(--primary)]" />
                <span className="font-semibold text-[var(--text)] text-md lg:text-lg">
                  {username}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="text-[var(--text)] text-md lg:text-lg cursor-pointer"
              >
                Профил
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="text-[var(--text)] text-md lg:text-lg cursor-pointer"
              >
                Опции
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/40 mx-auto border-0 w-[95%] h-px" />
              <DropdownMenuItem
                onClick={() => {
                  localStorage.clear();
                  navigate("/auth");
                }}
                className="font-bold text-destructive text-md lg:text-lg cursor-pointer"
              >
                <span className="text-[var(--accent)]">Одлогирај се</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </GlassCard>
    </>
  );
}
