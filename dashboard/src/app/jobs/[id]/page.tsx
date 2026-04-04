"use client";

import { useParams } from "next/navigation";
import { JobCardInner } from "@/components/JobCardInner";

export default function JobDetailPage() {
  const params = useParams();
  return <JobCardInner jobId={params.id as string} />;
}
