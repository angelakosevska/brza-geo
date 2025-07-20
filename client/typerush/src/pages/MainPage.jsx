import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MainPage() {
  return (
    <>
      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 py-3">
        <img
          src="/tr.svg"
          alt="Type Rush Logo"
          className="w-12 h-12 blink-cursor"
        />
        <UserRound className="w-12 h-12 text-[var(--primary)]" />
      </div>

      {/* Split layout below header */}
      <div className="flex w-full max-w-4xl mx-auto mt-8 gap-8 px-2">
        {/* Left: Main Actions */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Button className="w-full max-w-xs">Create a room</Button>
          <span className="text-sm text-gray-500">or</span>
          <Button className="w-full max-w-xs">Join a room</Button>
          <Button variant="outline" className="w-full max-w-xs">
            Categories
          </Button>
        </div>

        {/* Right: Profile Menu, only visible on md and up */}
        <div className="hidden md:flex flex-col gap-4 items-end min-w-[220px]">
          <div className="flex items-center gap-2">
            <UserRound className="w-8 h-8 text-[var(--primary)]" />
            <span className="font-semibold text-[var(--text)]">Player Name</span>
          </div>
          <Button variant="secondary" className="w-full">
            Profile
          </Button>
          <Button variant="secondary" className="w-full">
            Settings
          </Button>
          <Button variant="destructive" className="w-full">
            Log Out
          </Button>
        </div>
      </div>
    </>
  );
}
