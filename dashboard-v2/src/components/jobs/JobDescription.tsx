"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobDescriptionProps {
  html: string | null;
  text: string | null;
}

export function JobDescription({ html, text }: JobDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = html || text;

  if (!hasContent) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        No description available
      </p>
    );
  }

  return (
    <div className="relative">
      <div
        className={expanded ? "" : "max-h-[600px] overflow-hidden"}
      >
        {html ? (
          <div
            className="job-description"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-400">
            {text}
          </pre>
        )}
      </div>

      {!expanded && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent" />
      )}

      <div className="mt-2 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300"
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-1 h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-3 w-3" />
              Read full description
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
