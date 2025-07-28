import { useState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const username = localStorage.getItem("username") || "User";

  return (
    <>
      <div className="w-full flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img
            src="/tr1.svg"
            alt="Type Rush Logo"
            className="w-12 h-12 blink-cursor"
          />
          <span className="text-4xl font-black uppercase text-[var(--primary)] leading-none">
            TYPE RUSH
          </span>
        </div>

        {/* User Icon (always visible) */}
        <UserRound
          className="w-10 h-10 text-[var(--primary)] cursor-pointer"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        />
      </div>

      {/* Dropdown Menu */}
      {showProfileMenu && (
        <div className="flex flex-col items-center gap-4 px-4 mt-2">
          <div className="flex items-center gap-2">
            <UserRound className="w-6 h-6 text-[var(--primary)]" />
            <span className="text-sm font-semibold text-[var(--text)]">
              {username}
            </span>
          </div>

          <div className="flex flex-col items-center gap-3 w-full">
            <Button variant="secondary" className="w-full max-w-xs">
              Profile
            </Button>
            <Button variant="secondary" className="w-full max-w-xs">
              Settings
            </Button>
            <Button
              variant="destructive"
              className="w-full max-w-xs"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/auth";
              }}
            >
              Log Out
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
