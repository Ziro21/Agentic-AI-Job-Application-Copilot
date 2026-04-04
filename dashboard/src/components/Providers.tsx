"use client";

import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { useState } from "react";
import { CommandMenu } from "./CommandMenu";

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  Promise.all([
    import("react"),
    import("react-dom"),
    import("@axe-core/react")
  ]).then(([React, ReactDOM, axe]) => {
    axe.default(React.default || React, ReactDOM.default || ReactDOM, 1000);
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [networkError, setNetworkError] = useState(false);

  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (error.message.includes("Failed to fetch") || error.message.includes("ECONNREFUSED")) {
              setNetworkError(true);
            }
          },
          onSuccess: () => {
            setNetworkError(false);
          }
        }),
        defaultOptions: {
          queries: { 
            staleTime: 30_000,
            retry: (failureCount, error) => {
              if (error.message.includes("Failed to fetch")) return false;
              return failureCount < 3;
            }
          },
        },
      })
  );
  
  return (
    <QueryClientProvider client={client}>
      {networkError && (
        <div className="fixed top-0 inset-x-0 z-50 bg-red-900/95 text-white p-3 flex items-center justify-center space-x-3 text-sm shadow-xl border-b border-red-700 animate-in slide-in-from-top-full">
           <svg className="w-5 h-5 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <span>
             <strong>API unreachable.</strong> Please ensure the backend is running locally with <code className="bg-red-950 px-1 py-0.5 rounded font-mono text-xs">uvicorn api.main:app</code>.
           </span>
           <button onClick={() => setNetworkError(false)} className="opacity-70 hover:opacity-100 ml-4 font-bold">✕</button>
        </div>
      )}
      <div className={networkError ? "pt-12 transition-all" : "transition-all"}>
        {children}
        <CommandMenu />
      </div>
    </QueryClientProvider>
  );
}
