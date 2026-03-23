import { useEffect, useState, useCallback } from "react";

interface KeyboardNavOptions {
  items: string[];
  onSelect?: (id: string) => void;
  onAction?: (id: string, key: string) => void;
  enabled?: boolean;
}

export function useKeyboardNav({
  items,
  onSelect,
  onAction,
  enabled = true,
}: KeyboardNavOptions) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter": {
          e.preventDefault();
          setActiveIndex((prev) => {
            if (prev >= 0 && prev < items.length) {
              onSelect?.(items[prev]);
            }
            return prev;
          });
          break;
        }
        case "Escape":
          setActiveIndex(-1);
          break;
        default:
          if (
            e.key.length === 1 &&
            !e.metaKey &&
            !e.ctrlKey
          ) {
            setActiveIndex((prev) => {
              if (prev >= 0 && prev < items.length) {
                onAction?.(items[prev], e.key);
              }
              return prev;
            });
          }
          break;
      }
    },
    [enabled, items, onSelect, onAction]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Clamp activeIndex to valid range
  const clampedIndex =
    items.length === 0 ? -1 : Math.min(activeIndex, items.length - 1);

  return {
    activeIndex: clampedIndex,
    activeId: clampedIndex >= 0 ? items[clampedIndex] ?? null : null,
    setActiveIndex,
  };
}
