"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ALL_STATUSES } from "@/lib/status";
import { KanbanColumn } from "./KanbanColumn";
import { DragOverlayCard } from "./DragOverlayCard";
import type { ApplicationWithJob } from "@/lib/types";

interface KanbanBoardProps {
  applications: ApplicationWithJob[];
  onStatusChange: (jobId: string, newStatus: string) => void;
  isLoading?: boolean;
}

export function KanbanBoard({
  applications,
  onStatusChange,
  isLoading,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const grouped = useMemo(() => {
    const map = new Map<string, ApplicationWithJob[]>();
    for (const status of ALL_STATUSES) {
      map.set(status, []);
    }
    for (const app of applications) {
      const list = map.get(app.status);
      if (list) list.push(app);
      else map.set(app.status, [app]);
    }
    return map;
  }, [applications]);

  const activeApplication = useMemo(
    () => (activeId ? applications.find((a) => a.id === activeId) : undefined),
    [activeId, applications]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const app = applications.find((a) => a.id === active.id);
    const targetStatus = over.id as string;
    if (app && app.status !== targetStatus) {
      onStatusChange(app.job_id, targetStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ALL_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            applications={grouped.get(status) ?? []}
            onStatusChange={onStatusChange}
            isLoading={isLoading}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200 }}>
        {activeApplication ? (
          <DragOverlayCard application={activeApplication} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
