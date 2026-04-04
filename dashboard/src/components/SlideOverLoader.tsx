"use client";
import { useSearchParams } from "next/navigation";
import { JobSlideOver } from "./JobSlideOver";

export function SlideOverLoader() {
    const searchParams = useSearchParams();
    const jobId = searchParams.get('jobId');
    
    if (!jobId) return null;
    return <JobSlideOver jobId={jobId} />;
}
