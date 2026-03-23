"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface JobFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  minScore: number;
  onMinScoreChange: (value: number) => void;
  sort: "score_desc" | "recent_desc";
  onSortChange: (value: "score_desc" | "recent_desc") => void;
  matchedOnly: boolean;
  onMatchedOnlyChange: (value: boolean) => void;
  onReset: () => void;
}

export function JobFilters({
  search,
  onSearchChange,
  minScore,
  onMinScoreChange,
  sort,
  onSortChange,
  matchedOnly,
  onMatchedOnlyChange,
  onReset,
}: JobFiltersProps) {
  const activeCount =
    (search ? 1 : 0) + (minScore > 0 ? 1 : 0) + (matchedOnly ? 1 : 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Filters
        </h2>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-6 cursor-pointer px-2 text-[10px] text-zinc-500 hover:text-zinc-300"
          >
            <X className="mr-1 h-3 w-3" />
            Clear ({activeCount})
          </Button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Job title, company..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 bg-zinc-900 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Min Score */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <label className="text-[10px] uppercase tracking-wider text-zinc-500">
            Min Score
          </label>
          <span className="font-mono text-xs text-zinc-400">{minScore}</span>
        </div>
        <Slider
          value={[minScore]}
          onValueChange={(v) => onMinScoreChange(Array.isArray(v) ? v[0] : v)}
          min={0}
          max={100}
          step={5}
          className="cursor-pointer"
        />
      </div>

      {/* Sort */}
      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">
          Sort
        </label>
        <Select value={sort} onValueChange={(v) => onSortChange(v as "score_desc" | "recent_desc")}>
          <SelectTrigger className="h-8 bg-zinc-900 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score_desc">Best Match</SelectItem>
            <SelectItem value="recent_desc">Most Recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Matched Only */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400">Matched only</label>
        <Switch
          checked={matchedOnly}
          onCheckedChange={onMatchedOnlyChange}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
}
