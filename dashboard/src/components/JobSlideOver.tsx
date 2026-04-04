"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { JobCardInner } from "./JobCardInner";

export function JobSlideOver({ jobId }: { jobId: string }) {
    const router = useRouter();

    const closePanel = () => {
        router.push("/", { scroll: false });
    };

    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") router.push("/", { scroll: false });
        };
        document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [router]);

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/40 backdrop-blur-sm"
             onClick={closePanel}>
            <div className="absolute inset-y-0 right-0 max-w-full flex">
                {/* Framer motion or standard CSS transform */}
                <div 
                    className="w-screen max-w-3xl transform bg-zinc-950 border-l border-zinc-800 shadow-2xl transition-transform ease-in-out duration-300"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when interacting inwardly
                >
                    <div className="h-full overflow-y-auto">
                        <JobCardInner jobId={jobId} onClose={closePanel} />
                    </div>
                </div>
            </div>
        </div>
    );
}
