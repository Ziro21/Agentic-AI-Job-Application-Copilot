"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  {
    section: "Navigation",
    keys: [
      { key: "j / ↓", desc: "Next item" },
      { key: "k / ↑", desc: "Previous item" },
      { key: "Enter", desc: "Open selected" },
      { key: "Esc", desc: "Deselect / close" },
    ],
  },
  {
    section: "Actions",
    keys: [
      { key: "s", desc: "Save / bookmark selected job" },
      { key: "/", desc: "Focus search" },
    ],
  },
  {
    section: "Global",
    keys: [
      { key: "⌘K", desc: "Command palette" },
      { key: "?", desc: "Show this help" },
    ],
  },
];

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-sm text-zinc-300">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {SHORTCUTS.map((section) => (
            <div key={section.section}>
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {section.section}
              </h3>
              <div className="space-y-1.5">
                {section.keys.map(({ key, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-zinc-400">{desc}</span>
                    <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
