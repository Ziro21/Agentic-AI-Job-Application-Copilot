"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, Play, BarChart, X } from "lucide-react";
import { Command } from "cmdk";
import { api } from "@/lib/api";
import type { JobListItem } from "@/lib/types";

export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [jobs, setJobs] = useState<JobListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Autonomous fuzzy search resolution against API
    useEffect(() => {
        if (!search) {
            setJobs([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const results = await api.jobs.list({ q: search, page_size: 5 });
                setJobs(results.items);
            } catch (err) {
                console.error("Telemetry failure on Command Menu:", err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/80 pt-[15vh] backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <div className="w-full max-w-2xl transform overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl transition-all">
                <Command 
                    label="Global Command Menu" 
                    className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-zinc-900"
                    shouldFilter={false} // Disable builtin filtering to strictly rely on Server results
                >
                    <div className="flex items-center border-b border-zinc-800 px-3" cmdk-input-wrapper="">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-zinc-400" />
                        <Command.Input
                            autoFocus
                            placeholder="Type a command or search jobs..."
                            value={search}
                            onValueChange={setSearch}
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 text-zinc-100"
                        />
                        <button className="rounded p-1 text-zinc-500 hover:text-zinc-300" onClick={() => setOpen(false)}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <Command.List className="max-h-[300px] overflow-y-auto p-2">
                        <Command.Empty className="py-6 text-center text-sm text-zinc-500">
                            {loading ? "Scanning local node databases..." : "No targets found algorithmically."}
                        </Command.Empty>

                        <Command.Group heading="Navigation Nodes" className="px-2 text-xs font-medium text-zinc-500 mb-2">
                            <Command.Item 
                                onSelect={() => { setOpen(false); router.push('/'); }}
                                className="flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800 aria-selected:bg-zinc-800"
                            >
                                <Briefcase className="mr-2 h-4 w-4 text-indigo-400" /> Complete Master Job Feed
                            </Command.Item>
                            <Command.Item 
                                onSelect={() => { setOpen(false); router.push('/applications'); }}
                                className="flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800 aria-selected:bg-zinc-800"
                            >
                                <Play className="mr-2 h-4 w-4 text-emerald-400" /> Active Applications Hub
                            </Command.Item>
                            <Command.Item 
                                onSelect={() => { setOpen(false); router.push('/metrics'); }}
                                className="flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800 aria-selected:bg-zinc-800"
                            >
                                <BarChart className="mr-2 h-4 w-4 text-purple-400" /> Recharts Telemetry Pipeline
                            </Command.Item>
                        </Command.Group>

                        {jobs.length > 0 && (
                            <Command.Group heading="Job Match Intel" className="px-2 text-xs font-medium text-zinc-500">
                                {jobs.map((job) => (
                                    <Command.Item
                                        key={job.id}
                                        value={job.id}
                                        onSelect={() => {
                                            setOpen(false);
                                            router.push(`/jobs/${job.id}`);
                                        }}
                                        className="flex cursor-pointer flex-col items-start rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800 aria-selected:bg-zinc-800"
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <span className="font-semibold text-zinc-100">{job.title}</span>
                                            {job.match_score > 0 && (
                                                <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs text-indigo-400">
                                                    Match {job.match_score}%
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-zinc-500">{job.company_name}</span>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}
