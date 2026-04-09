"use client";

import { useEffect, useTransition } from "react";
import { generateTickets, updateTicketStatus } from "@/app/actions/tickets";
import type { Ticket, TicketStatus } from "@/types/database";

const COLUMNS: { key: TicketStatus; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

const STATUS_COLORS: Record<TicketStatus, string> = {
  todo: "border-zinc-200 dark:border-zinc-800",
  in_progress: "border-blue-200 dark:border-blue-800",
  done: "border-green-200 dark:border-green-800",
};

const MOVE_OPTIONS: Record<TicketStatus, { status: TicketStatus; label: string }[]> = {
  todo: [{ status: "in_progress", label: "Start" }],
  in_progress: [
    { status: "todo", label: "Move back" },
    { status: "done", label: "Complete" },
  ],
  done: [{ status: "in_progress", label: "Reopen" }],
};

function TicketCard({
  ticket,
  communitySlug,
}: {
  ticket: Ticket;
  communitySlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const moves = MOVE_OPTIONS[ticket.status];

  function handleMove(newStatus: TicketStatus) {
    startTransition(async () => {
      await updateTicketStatus(ticket.id, newStatus, communitySlug);
    });
  }

  return (
    <div
      className={`rounded-lg border p-3 ${STATUS_COLORS[ticket.status]} ${isPending ? "opacity-50" : ""}`}
    >
      <p className="text-sm font-medium">{ticket.title}</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {ticket.description}
      </p>
      {moves.length > 0 && (
        <div className="mt-2 flex gap-2">
          {moves.map((move) => (
            <button
              key={move.status}
              onClick={() => handleMove(move.status)}
              disabled={isPending}
              className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {move.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function KanbanBoard({
  tickets,
  communitySlug,
}: {
  tickets: Ticket[];
  communitySlug: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((col) => {
        const columnTickets = tickets
          .filter((t) => t.status === col.key)
          .sort((a, b) => a.position - b.position);

        return (
          <div key={col.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <span className="text-xs text-zinc-400">{columnTickets.length}</span>
            </div>
            <div className="space-y-2">
              {columnTickets.length > 0 ? (
                columnTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    communitySlug={communitySlug}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
                  No tickets
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TicketGenerator({ communityId }: { communityId: string }) {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      await generateTickets(communityId);
    });
  }, [communityId]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-600 dark:border-t-zinc-200" />
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Generating your build plan...
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Breaking down your MVP into actionable tickets
        </p>
      </div>
    );
  }

  return null;
}
