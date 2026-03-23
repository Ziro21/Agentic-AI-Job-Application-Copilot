import { useMemo } from "react";
import { isToday, isBefore, addDays, startOfDay } from "date-fns";
import { useAllApplications } from "./useApplications";
import type { ApplicationWithJob } from "@/lib/types";

interface FollowUpGroups {
  overdue: ApplicationWithJob[];
  dueToday: ApplicationWithJob[];
  upcoming: ApplicationWithJob[];
}

export function useFollowUpApplications(): FollowUpGroups {
  const { data } = useAllApplications();

  return useMemo(() => {
    const result: FollowUpGroups = { overdue: [], dueToday: [], upcoming: [] };
    if (!data?.items) return result;

    const now = new Date();
    const todayStart = startOfDay(now);
    const weekAhead = addDays(now, 7);

    for (const app of data.items) {
      if (!app.next_follow_up_at) continue;
      const d = new Date(app.next_follow_up_at);

      if (isToday(d)) {
        result.dueToday.push(app);
      } else if (isBefore(d, todayStart)) {
        result.overdue.push(app);
      } else if (isBefore(d, weekAhead)) {
        result.upcoming.push(app);
      }
    }

    return result;
  }, [data]);
}

export function useFollowUpCounts() {
  const groups = useFollowUpApplications();

  return useMemo(
    () => ({
      overdue: groups.overdue.length,
      dueToday: groups.dueToday.length,
      upcoming: groups.upcoming.length,
      total:
        groups.overdue.length +
        groups.dueToday.length +
        groups.upcoming.length,
    }),
    [groups]
  );
}
