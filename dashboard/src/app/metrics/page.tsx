"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Lightweight proxy fetcher if not natively in api.ts
async function fetchFunnel() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await fetch("http://127.0.0.1:8000/api/v1/metrics/funnel", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Funnel fetch failed");
    return res.json();
}

export default function MetricsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["metrics-funnel"],
        queryFn: fetchFunnel,
        refetchInterval: 30_000
    });

    if (isLoading) return <div className="p-6 text-zinc-500 animate-pulse">Loading telemetry engines...</div>;
    if (error) return <div className="p-6 text-red-500">Telemetry engine offline.</div>;

    const pipelineData = [
        { name: "Scraped", val: data.total_jobs_scraped, color: "#6b7280" },
        { name: "Valid Geography", val: data.jobs_passed_geography, color: "#374151" },
        { name: "Entry-Level", val: data.jobs_passed_experience, color: "#4b5563" },
        { name: "AI/ML Bound", val: data.jobs_passed_ai_ml, color: "#6366f1" },
        { name: "Saved", val: data.saved_jobs, color: "#a855f7" },
        { name: "Applications", val: data.applied_jobs, color: "#10b981" }
    ];

    return (
        <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-zinc-100">Pipeline Telemetry</h1>
                <p className="mt-0.5 text-sm text-zinc-500">Autonomous application trajectory metrics</p>
            </div>
            
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#52525b" tick={{fill: '#a1a1aa', fontSize: 12}} />
                        <YAxis stroke="#52525b" tick={{fill: '#a1a1aa'}} />
                        <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#e4e4e7" }} cursor={{fill: '#27272a'}} />
                        <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                            {pipelineData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded border border-zinc-800 bg-zinc-900/60 p-4">
                    <p className="font-mono text-xs text-zinc-500">Total Scraped</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-zinc-200">{data.total_jobs_scraped}</p>
                </div>
                <div className="rounded border border-zinc-800 bg-zinc-900/60 p-4">
                    <p className="font-mono text-xs text-zinc-500">AI Matches</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-indigo-400">{data.jobs_passed_ai_ml}</p>
                </div>
                <div className="rounded border border-zinc-800 bg-zinc-900/60 p-4">
                    <p className="font-mono text-xs text-zinc-500">Conversion Rate</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                        {data.total_jobs_scraped > 0 ? ((data.applied_jobs / data.total_jobs_scraped) * 100).toFixed(2) : 0}%
                    </p>
                </div>
                <div className="rounded border border-zinc-800 bg-zinc-900/60 p-4">
                    <p className="font-mono text-xs text-zinc-500">Applications</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-emerald-500">{data.applied_jobs}</p>
                </div>
            </div>
        </div>
    );
}
