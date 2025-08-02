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
      <GlassCard className="w-[90vw] p-4 max-h-25 align-middle">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/tr1.svg"
              alt="Type Rush Logo"
              className="w-12 h-12 blink-cursor"
            />
            <span
              className="text-3xl font-black uppercase text-[var(--primary)] leading-none cursor-pointer"
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
              className="w-auto min-w-[20vw] mt-2
          bg-[var(--background)]/30
          backdrop-blur-sm
          border border-[var(--background)] 
          rounded-3xl
          shadow-xl shadow-gray-500/20 "
            >
              <div className="flex items-center gap-2 px-2 py-2">
                <UserRound className="w-7 h-7 text-[var(--primary)]" />
                <span className="text-md lg:text-lg font-semibold text-[var(--text)]">
                  {username}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-md lg:text-lg text-[var(--text)]"
              >
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="cursor-pointer text-md lg:text-lg text-[var(--text)]"
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="h-px w-[95%] mx-auto bg-white/40 border-0" />
              <DropdownMenuItem
                onClick={() => {
                  localStorage.clear();
                  navigate("/auth");
                }}
                className="cursor-pointer text-destructive text-md lg:text-lg text-[var(--secondary)] font-bold"
              >
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </GlassCard>
    </>
  );
}
