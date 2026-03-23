"use client";

import { Menu, Command } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuClick: () => void;
  onCommandClick: () => void;
}

export function TopBar({ onMenuClick, onCommandClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-800/50 bg-black/90 px-4 backdrop-blur-sm lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="h-9 w-9 cursor-pointer text-zinc-400 hover:text-zinc-200"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <span className="flex-1 text-center text-sm font-semibold text-zinc-300">
        Job Copilot
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={onCommandClick}
        aria-label="Open command palette"
        className="h-9 w-9 cursor-pointer text-zinc-400 hover:text-zinc-200"
      >
        <Command className="h-4 w-4" />
      </Button>
    </header>
  );
}
