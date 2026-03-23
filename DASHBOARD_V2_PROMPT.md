# Dashboard V2 — Full Build Prompt
> Production-ready, deployable Next.js 15 dashboard for the Agentic AI Job Application Copilot.
> Place all output inside `dashboard-v2/` at the project root.

---

## 0. Prior Context

This project is a UK entry-level AI/ML job aggregator. The backend is a running **FastAPI** server (port 8000). Your job is to build **only the frontend** — a world-class React dashboard that consumes the existing API. Do not touch any backend files.

### Existing API (FastAPI — port 8000)

| Method | Endpoint | Query Params | Returns |
|--------|----------|--------------|---------|
| GET | `/api/jobs` | `search`, `min_score`, `sort_by`, `passed_filters_only`, `page`, `page_size` | `{ items: Job[], total: int, page: int, page_size: int }` |
| GET | `/api/jobs/{id}` | — | `Job` |
| GET | `/api/applications` | `status`, `page`, `page_size` | `{ items: ApplicationWithJob[], total: int }` |
| PUT | `/api/applications/{id}` | — | body: `{ status, applied_at?, notes? }` → `Application` |
| POST | `/api/applications` | — | body: `{ job_id, status }` → `Application` |
| GET | `/api/runs` | `page`, `page_size` | `{ items: RunLog[], total: int }` |

### Key TypeScript Types (match these exactly)

```typescript
interface Job {
  id: string;
  title: string;
  company_name: string | null;
  location: string | null;
  absolute_url: string;
  match_score: number;
  passed_filters: boolean;
  filter_reasons: Record<string, boolean>;
  match_reasons: string[];
  content_html: string | null;
  content_text: string | null;
  posted_at: string | null;
  created_at: string;
}

interface Application {
  id: string;
  job_id: string;
  status: 'saved' | 'applied' | 'oa' | 'interview' | 'offer' | 'rejected' | 'no_response';
  applied_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ApplicationWithJob extends Application {
  job_title: string | null;
  company_name: string | null;
  match_score: number | null;
}

interface RunLog {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'failed';
  jobs_fetched: number;
  jobs_new: number;
  jobs_updated: number;
  error_message: string | null;
}
```

### Application Pipeline

```
saved → applied → oa → interview → offer
         ↓           ↓         ↓
      rejected  no_response  rejected
```

---

## 1. Tech Stack (exact versions — do not deviate)

| Layer | Technology | Version | Reason |
|-------|-----------|---------|--------|
| Framework | **Next.js** | 15.x (App Router) | RSC, streaming, production-ready |
| Language | **TypeScript** | 5.x strict | Type safety end-to-end |
| Styling | **Tailwind CSS** | v4 (via `@tailwindcss/vite` or next integration) | Utility-first, v4 CSS variables natively |
| Components | **shadcn/ui** | latest | Unstyled + accessible + customisable |
| Icons | **Lucide React** | latest | Consistent, tree-shakeable, 1400+ icons |
| Data fetching | **TanStack Query** | v5 (`@tanstack/react-query`) | Cache, stale-while-revalidate, mutations |
| Charts | **Recharts** | 2.x | Composable, Tailwind-friendly, SSR-safe |
| Animations | **Framer Motion** | 11.x | Production-grade, reduced-motion aware |
| Forms | **React Hook Form** + **Zod** | latest | Type-safe forms with validation |
| Date formatting | **date-fns** | 3.x | Tree-shakeable, no moment.js |
| Fonts | **next/font** with Inter + JetBrains Mono | — | Zero layout shift, self-hosted |

**DO NOT** use: Axios (use native fetch), Moment.js, Lodash, class-variance-authority directly (shadcn handles it), @emotion, styled-components, or any CSS-in-JS.

---

## 2. Before Writing a Single Line of Code — Search the Documentation

You **MUST** fetch and read the following documentation pages before implementing anything. These are the ground-truth references for every technical decision.

### Required Documentation Fetches

```
# Next.js 15 App Router
https://nextjs.org/docs/app/getting-started/installation
https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates
https://nextjs.org/docs/app/building-your-application/data-fetching/fetching
https://nextjs.org/docs/app/api-reference/components/link
https://nextjs.org/docs/app/api-reference/functions/use-router

# Tailwind CSS v4
https://tailwindcss.com/docs/v4-beta
https://tailwindcss.com/docs/theme
https://tailwindcss.com/docs/dark-mode

# shadcn/ui
https://ui.shadcn.com/docs/installation/next
https://ui.shadcn.com/docs/theming
https://ui.shadcn.com/docs/components/button
https://ui.shadcn.com/docs/components/badge
https://ui.shadcn.com/docs/components/card
https://ui.shadcn.com/docs/components/table
https://ui.shadcn.com/docs/components/dialog
https://ui.shadcn.com/docs/components/select
https://ui.shadcn.com/docs/components/input
https://ui.shadcn.com/docs/components/textarea
https://ui.shadcn.com/blocks

# TanStack Query v5
https://tanstack.com/query/latest/docs/framework/react/overview
https://tanstack.com/query/latest/docs/framework/react/guides/queries
https://tanstack.com/query/latest/docs/framework/react/guides/mutations
https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation

# Recharts
https://recharts.org/en-US/api/AreaChart
https://recharts.org/en-US/api/BarChart
https://recharts.org/en-US/api/ResponsiveContainer

# Framer Motion
https://www.framer.com/motion/animation/
https://www.framer.com/motion/reduce-motion/

# Lucide React
https://lucide.dev/guide/packages/lucide-react

# React Hook Form + Zod
https://react-hook-form.com/get-started
https://zod.dev/?id=basic-usage
```

---

## 3. Project Setup

### 3a. Bootstrap

```bash
# Inside the project root (one level up from this file)
npx create-next-app@latest dashboard-v2 \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack

cd dashboard-v2

# shadcn/ui init (choose: New York style, zinc base color, CSS variables: yes)
npx shadcn@latest init

# Install required shadcn components
npx shadcn@latest add button badge card table dialog select input textarea
npx shadcn@latest add dropdown-menu separator skeleton tooltip progress
npx shadcn@latest add command popover

# npm packages
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install recharts
npm install framer-motion
npm install react-hook-form @hookform/resolvers zod
npm install date-fns
npm install lucide-react
```

### 3b. Folder Structure (strict — follow exactly)

```
dashboard-v2/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout: fonts, QueryProvider, theme
│   │   ├── page.tsx                # /  → redirect to /jobs
│   │   ├── globals.css             # Tailwind v4 @theme + global styles
│   │   ├── jobs/
│   │   │   ├── page.tsx            # Jobs list page
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Job detail page
│   │   ├── applications/
│   │   │   └── page.tsx            # Applications tracker (kanban-style)
│   │   ├── analytics/
│   │   │   └── page.tsx            # Analytics & charts page (NEW)
│   │   └── runs/
│   │       └── page.tsx            # Ingest run history
│   ├── components/
│   │   ├── ui/                     # shadcn generated (do not edit)
│   │   ├── layout/
│   │   │   ├── AppShell.tsx        # Sidebar + main content wrapper
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   ├── TopBar.tsx          # Top bar with search + profile
│   │   │   └── CommandPalette.tsx  # Cmd+K global command search
│   │   ├── jobs/
│   │   │   ├── JobCard.tsx         # Card variant for grid view
│   │   │   ├── JobRow.tsx          # Row variant for list view
│   │   │   ├── JobFilters.tsx      # Filter sidebar panel
│   │   │   ├── JobDescription.tsx  # HTML/text description renderer
│   │   │   └── ScoreBadge.tsx      # Score ring with color coding
│   │   ├── applications/
│   │   │   ├── KanbanBoard.tsx     # Drag-free kanban with columns
│   │   │   ├── KanbanColumn.tsx    # Single status column
│   │   │   ├── ApplicationCard.tsx # Card inside kanban column
│   │   │   ├── ApplicationTable.tsx# Compact table fallback view
│   │   │   ├── StatusBadge.tsx     # Colored dot + label badge
│   │   │   └── PipelineStepper.tsx # Linear stepper for detail view
│   │   ├── analytics/
│   │   │   ├── StatCard.tsx        # KPI metric card with trend
│   │   │   ├── ApplicationFunnel.tsx # Funnel/bar chart: pipeline stages
│   │   │   ├── ScoreDistribution.tsx # Area chart: score over time
│   │   │   └── ActivityTimeline.tsx  # Timeline of recent actions
│   │   └── shared/
│   │       ├── EmptyState.tsx      # Reusable empty state with icon + CTA
│   │       ├── ErrorBoundary.tsx   # Error boundary with retry
│   │       ├── LoadingSkeleton.tsx # Skeleton variants for each page
│   │       ├── FilterBadge.tsx     # Pass/fail filter indicator
│   │       └── IngestStatus.tsx    # Latest ingest run widget
│   ├── lib/
│   │   ├── api.ts                  # Typed fetch wrappers for all endpoints
│   │   ├── types.ts                # All TypeScript interfaces (from §0)
│   │   ├── status.ts               # Status config (colors, labels, pipeline)
│   │   ├── query-keys.ts           # TanStack Query key factory
│   │   └── utils.ts                # cn(), formatDate(), scoreColor()
│   ├── hooks/
│   │   ├── useJobs.ts              # useQuery wrapper for jobs endpoints
│   │   ├── useApplications.ts      # useQuery + useMutation for applications
│   │   └── useDebounce.ts          # 300ms debounce hook
│   └── providers/
│       └── QueryProvider.tsx       # TanStack QueryClientProvider
├── .env.local                      # NEXT_PUBLIC_API_URL=http://localhost:8000
├── next.config.ts
├── tailwind.config.ts              # (only if Tailwind v3; skip for v4)
└── components.json                 # shadcn config
```

---

## 4. Design System

### 4a. Color Palette (OLED Dark — WCAG AAA)

Implement these as CSS custom properties inside `globals.css` via `@theme`:

```css
@theme {
  /* Backgrounds - true OLED blacks */
  --color-bg-base: #000000;        /* page background */
  --color-bg-raised: #0a0a0a;      /* cards, panels */
  --color-bg-overlay: #111111;     /* hover states */
  --color-bg-sunken: #050505;      /* input backgrounds */

  /* Borders */
  --color-border-subtle: #1a1a1a;  /* dividers */
  --color-border-default: #262626; /* card borders */
  --color-border-strong: #404040;  /* focused inputs */

  /* Text */
  --color-text-primary: #fafafa;   /* headings, emphasis */
  --color-text-secondary: #a1a1aa; /* body, descriptions */
  --color-text-muted: #52525b;     /* placeholders, disabled */

  /* Brand - Indigo as primary accent */
  --color-brand: #6366f1;          /* primary actions */
  --color-brand-hover: #4f46e5;    /* hover on primary */
  --color-brand-muted: #312e81;    /* subtle brand bg */
  --color-brand-glow: #6366f120;   /* glow/halo effect */

  /* Status pipeline colors */
  --color-saved: #6366f1;          /* indigo */
  --color-applied: #0ea5e9;        /* sky */
  --color-oa: #f59e0b;             /* amber */
  --color-interview: #a78bfa;      /* violet */
  --color-offer: #10b981;          /* emerald */
  --color-rejected: #52525b;       /* zinc */
  --color-no-response: #3f3f46;    /* dark zinc */

  /* Score tiers */
  --color-score-high: #10b981;     /* ≥70 */
  --color-score-mid: #f59e0b;      /* 50-69 */
  --color-score-low: #ef4444;      /* <50 */

  /* Chart colors */
  --color-chart-1: #6366f1;
  --color-chart-2: #0ea5e9;
  --color-chart-3: #10b981;
  --color-chart-4: #f59e0b;
  --color-chart-5: #a78bfa;
}
```

### 4b. Typography

```css
/* In layout.tsx via next/font */
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
```

Rules:
- **Headings**: Inter 600–700, tracking-tight
- **Body**: Inter 400, 0.875rem, line-height 1.6
- **Data / Scores / Badges / Timestamps**: JetBrains Mono exclusively
- **Min body font size**: 14px (never below)
- **Max line length**: 72ch on reading-heavy areas

### 4c. Spacing & Radius

- Base unit: **4px (0.25rem)**
- Standard gap: **16px (gap-4)**, expanded: **24px (gap-6)**
- Card border radius: **8px (rounded-lg)**
- Button radius: **6px (rounded-md)**
- Badge radius: **4px (rounded)**
- Card padding: **16px (p-4)** or **24px (p-6)** for featured cards

### 4d. Elevation (shadow system)

```css
/* cards: subtle border only, no drop shadow */
border: 1px solid var(--color-border-default);

/* focused / active cards */
border: 1px solid var(--color-border-strong);
box-shadow: 0 0 0 1px var(--color-brand-glow);

/* modals / dialogs */
box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);
```

---

## 5. Page-by-Page Specifications

### Page 1: Jobs List (`/jobs`)

**Layout**: 3-column: sidebar (280px, sticky) | main (flex-1) | (no right panel)

**Sidebar — Filter Panel** (`JobFilters.tsx`):
- Text search input with debounce 300ms (Lucide `Search` icon inside input)
- Minimum score slider (shadcn Slider, range 0–100, step 5, live value label)
- Sort dropdown: `Best Match`, `Newest First`, `Oldest First` (shadcn Select)
- Toggle: "Show matched only" (shadcn Switch)
- Active filter count badge on collapse button

**Top Bar** (above job list):
- Result count: `{n} jobs` in text-muted, animates when filter changes
- View toggle: Grid / List (two Lucide icon buttons, `LayoutGrid` + `List`)
- Sort (mobile — mirrors sidebar select)

**List View** (`JobRow.tsx`):
- Left border: 3px, color = application status (transparent if no application)
- Company logo placeholder: 32×32 rounded, initials fallback
- Title + `StatusBadge` inline if application exists
- Company name | Location pill | Posted date
- Right: `ScoreBadge` + filter pass/fail indicators
- Hover: `bg-overlay` + scale-[1.001] transform, 150ms

**Grid View** (`JobCard.tsx`):
- 2-col on md, 3-col on xl
- Card with score ring top-right corner
- Title, company, location, 2-line description preview
- Bottom row: filter badges + apply CTA
- Framer Motion: staggered `initial={{ opacity:0, y:8 }}` on mount

**ScoreBadge** (`ScoreBadge.tsx`):
- Circular SVG ring progress (not just a number)
- Green (≥70) / Amber (50–69) / Red (<50)
- Center number in JetBrains Mono bold
- `/100` subscript in muted

**KPI Strip** (above filter sidebar, full width):
- 4 stat cards: Total Jobs | Matched | Active Applications | Offers
- Each card: large mono number + trend label
- Micro area sparkline in background (Recharts, 2-data-point minimum)
- Uses `page_size: 1` trick for total counts

**Empty State**: Lucide `SearchX` icon, "No jobs match your filters", reset button.

---

### Page 2: Job Detail (`/jobs/[id]`)

**Layout**: Single column, max-w-4xl centered, generous padding

**Header section**:
- Company logo (32px) + Company name (text-muted)
- Job title (text-2xl, font-bold)
- Location badge + `ScoreBadge` (large variant, 56px ring)
- External link button: "View on Greenhouse" (Lucide `ExternalLink`)
- Posted date in mono/muted

**Application Status Block** (card, below header):
- If no application: "Save this job" indigo button (POST /api/applications)
- If application exists:
  - **Pipeline Stepper**: horizontal, 5 stages with chevron SVGs between them
    - Each stage: circle + label below, colored when active/past, muted when future
    - Click any stage to advance/change to that stage
  - **Exit actions**: "Mark Rejected" + "No Response" — small destructive variant buttons, shown below stepper
  - Notes textarea (shadcn Textarea, auto-save on blur via mutation)
  - Applied date picker (shadcn Popover + Calendar, optional)

**Analysis Grid** (2-column on md+):
- Left: Filter Analysis — each filter (uk/entry_level/ai_ml) with pass/fail badge + explanation text
- Right: Match Reasons — bulleted list, indigo bullet points, italic descriptions

**Job Description** (below analysis):
- Rendered with `dangerouslySetInnerHTML` if `content_html` present
- `.prose` style class: zinc-400 body text, zinc-200 headings, indigo links, custom bullets
- Fallback to `<pre>` only if `content_html` is null
- "Read full description" expand/collapse if >600px height (Framer Motion height animation)

---

### Page 3: Applications (`/applications`)

**Default view: Kanban Board** (`KanbanBoard.tsx`)

**Layout**: Horizontal scroll container, each column 280px min-width

**Columns** (one per pipeline stage + 2 exit columns):
```
Saved | Applied | OA | Interview | Offer | Rejected | No Response
```

**Column header**:
- Colored dot + stage label (from status.ts)
- Count badge in muted
- Column-specific accent color on top border (3px)

**Application Card** (`ApplicationCard.tsx`):
- Job title (truncated 1 line)
- Company name (text-muted, 0.75rem)
- Score badge (compact, pill variant)
- Applied date (mono, muted)
- Hover: border glow in status color
- Click → opens Job Detail (link to `/jobs/[id]`)
- Status change: dropdown on card (Lucide `ChevronDown`) → moves card visually with Framer `AnimatePresence`

**Table toggle** (top-right): Switch to `ApplicationTable.tsx`:
- Columns: Job Title | Company | Score | Status | Applied Date | Notes
- Score renders `ScoreBadge` compact
- Status renders `StatusBadge` + inline select for changing
- Notes: truncated 40ch, tooltip on hover for full text
- Sort by any column header

**Pipeline Summary Strip** (top of page, always visible):
- 5 horizontal stat chips: `{n} Saved`, `{n} Applied`, etc.
- Click a chip to filter the view to that status
- Active chip: brand background

---

### Page 4: Analytics (`/analytics`) — NEW PAGE

**Layout**: 2-column grid on lg+, single column on mobile

**Row 1 — KPI Cards** (4 across):
- Total tracked jobs
- Match rate (% passed_filters / total)
- Application rate (applications / matched jobs × 100)
- Response rate (non-rejected, non-no-response / total applications)

Each card:
- Large mono stat (animated count-up on mount via Framer)
- Sub-label in muted
- Trend arrow (Lucide `TrendingUp` / `TrendingDown`) in green/red

**Row 2 — Main Charts** (2 columns):

**Left — Application Funnel** (`ApplicationFunnel.tsx`):
- BarChart (Recharts `BarChart` horizontal)
- Data: count per pipeline stage
- Colors: status colors from design system
- Tooltip: count + % of saved
- Label: stage name on Y axis

**Right — Score Distribution** (`ScoreDistribution.tsx`):
- AreaChart (Recharts `AreaChart`)
- X axis: score bands (0-10, 10-20, ..., 90-100)
- Y axis: job count in each band
- Fill: indigo gradient (var --color-chart-1 at 40% opacity)
- Stroke: brand color
- Tooltip: "N jobs scored {band}"

**Row 3 — Activity Timeline** (`ActivityTimeline.tsx`):
- Vertical list of last 20 events (application status changes, ingest runs)
- Each entry: dot (colored by type) + timestamp (mono) + description
- Framer Motion: staggered enter animation

---

### Page 5: Runs (`/runs`)

**Layout**: Single column, max-w-3xl centered

**Ingest Status Widget** (top — `IngestStatus.tsx`):
- Latest run status: large colored dot + `RUNNING` / `SUCCESS` / `FAILED` in mono caps
- 3 stats in a grid: Fetched | New | Updated
- Timestamp: "Last run {relative time}"
- If `status === 'failed'`: collapsible error message block (red border, mono text)

**Runs Table**:
- Columns: Started | Duration | Status | Fetched | New | Updated | Error
- Duration: computed from `started_at` - `finished_at`, formatted as "2m 34s"
- Status: colored dot + text
- Error: truncated 60ch, expandable popover
- Pagination: shadcn Pagination component, 20 per page

---

## 6. Global Layout (`AppShell.tsx` + `Sidebar.tsx`)

### Sidebar (desktop: 240px fixed left, mobile: slide-over drawer)

```
[Logo: radar SVG + "Job Copilot" wordmark]
─────────────────────────────
[Ingest Status mini widget]
─────────────────────────────
Navigation:
  ○ Jobs           [total count badge]
  ○ Applications   [active count badge]
  ○ Analytics
  ○ Runs           [last run status dot]
─────────────────────────────
[bottom] GitHub link | Version
```

**Logo**: SVG radar/signal icon, indigo accent, 24×24. Wordmark "Job Copilot" in Inter 600.

**Nav items**: Lucide icons left-aligned, text label, right-aligned count badge (brand pill). Active item: `bg-brand-muted` background + left `border-l-2 border-brand`.

**Sidebar behavior**:
- Desktop: always visible, fixed, `z-30`
- Mobile: hidden, opens via hamburger in TopBar, `AnimatePresence` slide from left (Framer `x: -240 → 0`)
- Backdrop blur overlay on mobile when open

### TopBar (desktop: hidden / mobile: 56px fixed top)
- Hamburger menu (Lucide `Menu`)
- Logo center on mobile
- Cmd+K command palette trigger (Lucide `Command`, text "⌘K")

### Command Palette (`CommandPalette.tsx`)
- shadcn `Command` component inside a `Dialog`
- Opens on `Cmd+K` / `Ctrl+K` globally
- Sections: "Navigate to" (pages), "Recent Jobs" (last 5 from query cache)
- Search filters results live

---

## 7. API Client (`lib/api.ts`)

Implement a fully typed, centralized API client. Use native `fetch` only — no Axios.

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  jobs: {
    list: (params: JobListParams) => apiFetch<PaginatedResponse<Job>>(`/api/jobs?${new URLSearchParams(...)}`),
    get: (id: string) => apiFetch<Job>(`/api/jobs/${id}`),
  },
  applications: {
    list: (params?: ApplicationListParams) => apiFetch<PaginatedResponse<ApplicationWithJob>>(`/api/applications?...`),
    create: (body: { job_id: string; status: string }) => apiFetch<Application>('/api/applications', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Application>) => apiFetch<Application>(`/api/applications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  runs: {
    list: (params?: RunListParams) => apiFetch<PaginatedResponse<RunLog>>('/api/runs?...'),
  },
};
```

### Query Key Factory (`lib/query-keys.ts`)

```typescript
export const queryKeys = {
  jobs: {
    all: ['jobs'] as const,
    list: (params: JobListParams) => ['jobs', 'list', params] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
  },
  applications: {
    all: ['applications'] as const,
    list: (params?: ApplicationListParams) => ['applications', 'list', params] as const,
    counts: ['applications', 'counts'] as const,
  },
  runs: {
    all: ['runs'] as const,
    list: (params?: RunListParams) => ['runs', 'list', params] as const,
    latest: ['runs', 'latest'] as const,
  },
};
```

---

## 8. Status Config (`lib/status.ts`)

Single source of truth. Used by every component that renders application status.

```typescript
export type ApplicationStatus = 'saved' | 'applied' | 'oa' | 'interview' | 'offer' | 'rejected' | 'no_response';

interface StatusConfig {
  label: string;
  shortLabel: string;
  icon: string;               // Lucide icon name
  pill: string;               // Tailwind classes for badge
  border: string;             // border-l-* class for JobRow
  dot: string;                // bg-* class for dot indicator
  column: string;             // Kanban column header bg
}

export const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  saved:       { label: 'Saved',             shortLabel: 'Saved',    icon: 'Bookmark',    pill: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25', border: 'border-l-indigo-500',  dot: 'bg-indigo-400',  column: 'border-t-indigo-500'  },
  applied:     { label: 'Applied',           shortLabel: 'Applied',  icon: 'Send',        pill: 'bg-sky-500/15 text-sky-400 border border-sky-500/25',         border: 'border-l-sky-500',     dot: 'bg-sky-400',     column: 'border-t-sky-500'     },
  oa:          { label: 'Online Assessment', shortLabel: 'OA',       icon: 'FileCode',    pill: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',   border: 'border-l-amber-500',   dot: 'bg-amber-400',   column: 'border-t-amber-500'   },
  interview:   { label: 'Interview',         shortLabel: 'Interview',icon: 'Users',       pill: 'bg-violet-500/15 text-violet-400 border border-violet-500/25',border: 'border-l-violet-500',  dot: 'bg-violet-400',  column: 'border-t-violet-500'  },
  offer:       { label: 'Offer',             shortLabel: 'Offer',    icon: 'PartyPopper', pill: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',border:'border-l-emerald-500',dot: 'bg-emerald-400', column: 'border-t-emerald-500' },
  rejected:    { label: 'Rejected',          shortLabel: 'Rejected', icon: 'XCircle',     pill: 'bg-zinc-700/40 text-zinc-500 border border-zinc-700/30',       border: 'border-l-zinc-600',    dot: 'bg-zinc-600',    column: 'border-t-zinc-700'    },
  no_response: { label: 'No Response',       shortLabel: 'Ghost',    icon: 'Ghost',       pill: 'bg-zinc-800/40 text-zinc-600 border border-zinc-700/20',       border: 'border-l-zinc-700',    dot: 'bg-zinc-700',    column: 'border-t-zinc-800'    },
};

export const PIPELINE_STAGES: ApplicationStatus[] = ['saved', 'applied', 'oa', 'interview', 'offer'];
export const EXIT_STATUSES: ApplicationStatus[] = ['rejected', 'no_response'];
export const ALL_STATUSES: ApplicationStatus[] = [...PIPELINE_STAGES, ...EXIT_STATUSES];

export const getStatusConfig = (status: string): StatusConfig =>
  STATUS_CONFIG[status as ApplicationStatus] ?? STATUS_CONFIG.saved;
```

---

## 9. Animation Guidelines

Use Framer Motion for all meaningful transitions. Respect `prefers-reduced-motion`.

```typescript
// Standard page enter animation
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

// Staggered list items
const containerVariants = {
  animate: { transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15 } },
};

// Reduced motion check
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

Rules:
- Page transitions: `opacity 0→1`, `y 8→0`, 200ms
- List stagger: 40ms between items, max 10 items staggered (rest instant)
- Kanban card move: `AnimatePresence` + `layout` prop on cards
- Skeleton shimmer: `animate-pulse` (Tailwind), never custom keyframes
- Count-up on Analytics KPIs: Framer Motion `useSpring` + `useTransform`
- **Never** animate `width`, `height`, `padding` directly — use `transform` only

---

## 10. Loading & Error States

Every data-fetching component must handle all 3 states:

### Loading (Skeleton)
Create `LoadingSkeleton.tsx` with named exports:
```typescript
export function JobListSkeleton()      // 8 shimmer rows
export function JobDetailSkeleton()    // Header + analysis grid skeleton
export function ApplicationsSkeleton() // 3 kanban columns with 2 cards each
export function AnalyticsSkeleton()    // 4 stat cards + 2 chart placeholders
export function RunsSkeleton()         // 10 table row skeletons
```

All skeletons use `<Skeleton />` from shadcn with `animate-pulse`.

### Error State
Use `ErrorBoundary.tsx`:
```typescript
// Shows: Lucide AlertTriangle icon + error message + "Try Again" button
// Try Again calls queryClient.invalidateQueries
// Wrap each page-level component
```

### Empty State
`EmptyState.tsx` accepts `icon`, `title`, `description`, `action` props.

---

## 11. Accessibility Requirements (WCAG AA minimum, target AAA)

- All interactive elements: min 44×44px touch target
- All icon-only buttons: `aria-label` required
- Color is **never** the only indicator — always pair with text/icon
- Focus rings: `focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-black`
- Form inputs: always have associated `<label>`
- Tables: `<thead>` with `<th scope="col">` for all data tables
- Kanban columns: `role="region"` + `aria-label`
- Images: `alt` text always present (or `alt=""` for decorative)
- Skip-to-content link as first element in body

---

## 12. Performance Requirements

- **LCP < 2.5s** on localhost
- **No layout shift** on data load — always reserve space with skeletons
- **Debounce** all search/filter inputs at 300ms
- **Stale-while-revalidate**: `staleTime: 30_000` for jobs, `staleTime: 10_000` for applications
- **Query deduplication**: use consistent queryKeys — never create duplicate requests for same data
- **Font display: swap** on all `next/font` declarations
- **Image**: no external images (use initials avatars, no `<img>` to external URLs)
- **Bundle**: check with `next build && next analyze` — target < 200kb first load JS

---

## 13. Deployment Readiness

### Environment Variables

`.env.local` (development):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`.env.production` (production — fill in):
```
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',               // for Docker
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,                // type-safe Link hrefs
  },
};

export default config;
```

### `Dockerfile`

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]
```

### `docker-compose.yml` (for reference — runs alongside existing backend)

```yaml
services:
  dashboard-v2:
    build:
      context: ./dashboard-v2
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8000
    depends_on:
      - api
```

---

## 14. Quality Checklist (verify before declaring done)

### Visual
- [ ] OLED black background on all pages, no grey tinting
- [ ] All text passes WCAG AA contrast (4.5:1 body, 3:1 large text)
- [ ] No emoji used as icons — Lucide only
- [ ] `cursor-pointer` on every clickable element
- [ ] Hover states on all interactive elements (150ms transition)
- [ ] Focus rings visible on keyboard navigation
- [ ] Skeleton shown while loading on every page
- [ ] Empty state shown when no data

### Functionality
- [ ] Jobs filter: search + score + sort + toggle all work
- [ ] Debounce working (no API call on every keystroke)
- [ ] Application status update reflects immediately (optimistic update or invalidation)
- [ ] Pipeline stepper advances status correctly
- [ ] Notes save on blur
- [ ] Kanban board shows correct columns
- [ ] Analytics charts render with real data
- [ ] Runs table shows duration + status correctly
- [ ] Cmd+K palette opens and navigates

### Responsive
- [ ] 375px (mobile): sidebar hidden, single column, bottom nav
- [ ] 768px (tablet): sidebar hidden, 2-col grid
- [ ] 1024px (desktop): sidebar visible, full layout
- [ ] 1440px (wide): max-width container centered, no stretching

### Code Quality
- [ ] No `any` TypeScript types
- [ ] All API calls use `api.ts` — no raw `fetch` in components
- [ ] All query keys from `query-keys.ts` — no inline strings
- [ ] No `console.log` in production code
- [ ] Error boundaries wrapping all pages
- [ ] `'use client'` directive only where state/effects needed (prefer RSC for static pages)

### Build
- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run type-check` (`tsc --noEmit`) passes clean
- [ ] Docker build completes successfully

---

## 15. Implementation Order

Build in this exact sequence to avoid dependency issues:

1. **Bootstrap** — `create-next-app`, shadcn init, install all packages
2. **Fetch docs** — Read all documentation URLs listed in §2
3. **Design tokens** — `globals.css` with full `@theme` block, fonts in `layout.tsx`
4. **Types + API** — `types.ts`, `status.ts`, `query-keys.ts`, `api.ts`
5. **Providers** — `QueryProvider.tsx`, wrap in `layout.tsx`
6. **Shared components** — `EmptyState`, `LoadingSkeleton`, `ScoreBadge`, `StatusBadge`, `FilterBadge`
7. **Layout** — `AppShell`, `Sidebar`, `TopBar`, `CommandPalette`
8. **Jobs page** — `JobFilters`, `JobRow`, `JobCard`, `page.tsx`
9. **Job detail page** — `PipelineStepper`, `JobDescription`, `page.tsx`
10. **Applications page** — `KanbanBoard`, `KanbanColumn`, `ApplicationCard`, `ApplicationTable`, `page.tsx`
11. **Analytics page** — `StatCard`, `ApplicationFunnel`, `ScoreDistribution`, `ActivityTimeline`, `page.tsx`
12. **Runs page** — `IngestStatus`, `page.tsx`
13. **Polish** — Animations, transitions, responsive fixes, a11y audit
14. **Build check** — `npm run build`, `npm run lint`, type-check, Dockerfile

---

## 16. Final Notes

- The existing `dashboard/` folder is a different project — **do not import from it**
- Port **3001** to avoid conflict with existing dashboard on 3000
- Run with `npm run dev -- --port 3001` in development
- The backend has CORS set to `*` so no proxy config needed
- If the backend is not running, all API calls will fail gracefully into error states
- All 5 pipeline stages + 2 exit statuses must be supported exactly as specified
- Do not add any features not listed here — focus on quality over quantity
