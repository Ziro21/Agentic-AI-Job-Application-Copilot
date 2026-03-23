import {
  Briefcase,
  Search,
  Globe,
  FolderKanban,
  Bookmark,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  Activity,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyScene =
  | "no-jobs"
  | "no-applications"
  | "no-matches"
  | "empty-column"
  | "no-runs";

const SCENES: Record<
  EmptyScene,
  { center: React.ElementType; orbits: React.ElementType[] }
> = {
  "no-jobs": { center: Briefcase, orbits: [Search, Globe] },
  "no-applications": { center: FolderKanban, orbits: [Bookmark, ArrowRight] },
  "no-matches": { center: Filter, orbits: [SlidersHorizontal, Search] },
  "empty-column": { center: ArrowRight, orbits: [] },
  "no-runs": { center: Activity, orbits: [RefreshCw] },
};

export function EmptyStateIllustration({
  scene,
  className,
}: {
  scene: EmptyScene;
  className?: string;
}) {
  const { center: Center, orbits } = SCENES[scene];

  if (scene === "empty-column") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-zinc-800 py-8",
          className
        )}
      >
        <Center className="h-5 w-5 text-zinc-700" />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {orbits[0] &&
        (() => {
          const Orbit0 = orbits[0];
          return (
            <Orbit0 className="absolute -top-2 -left-4 h-5 w-5 text-zinc-800/40" />
          );
        })()}
      {orbits[1] &&
        (() => {
          const Orbit1 = orbits[1];
          return (
            <Orbit1 className="absolute -right-3 -bottom-1 h-4 w-4 text-zinc-800/30" />
          );
        })()}
      <div className="rounded-xl bg-zinc-900/80 p-4">
        <Center className="h-8 w-8 text-zinc-500" />
      </div>
    </div>
  );
}
