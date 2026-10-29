"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

type Patch = Record<string, unknown>;

/**
 * Debounced, serialized saving of partial updates (D-009).
 * Edits are merged into one pending patch; only one request runs at a time,
 * and whatever changed meanwhile is sent right after it, so an older save can
 * never land after a newer one. A failed patch is kept and retried with the next edit.
 */
export function useAutosave<T extends Patch>(
  save: (patch: Partial<T>) => Promise<void>,
  {
    delayMs = 800,
    onLeave,
  }: {
    delayMs?: number;
    /** Runs on unmount once the final save has settled. */
    onLeave?: () => void;
  } = {},
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<Partial<T>>({});
  const running = useRef<Promise<void> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveRef = useRef(save);
  const onLeaveRef = useRef(onLeave);

  useEffect(() => {
    saveRef.current = save;
    onLeaveRef.current = onLeave;
  }, [save, onLeave]);

  const run = useCallback(async (): Promise<void> => {
    try {
      while (Object.keys(pending.current).length > 0) {
        const patch = pending.current;
        pending.current = {};
        setStatus("saving");
        try {
          await saveRef.current(patch);
        } catch (err) {
          // Newer edits win over the failed ones when merging back.
          pending.current = { ...patch, ...pending.current };
          setError(err instanceof Error ? err.message : "Save failed");
          setStatus("error");
          return;
        }
      }
      setError(null);
      setStatus("saved");
    } finally {
      running.current = null;
    }
  }, []);

  /** Saves now; resolves once everything queued so far has been attempted. */
  const flush = useCallback((): Promise<void> => {
    clearTimeout(timer.current);
    timer.current = undefined;
    // The running save's loop picks up anything queued meanwhile.
    if (running.current) return running.current;
    if (Object.keys(pending.current).length === 0) return Promise.resolve();
    running.current = run();
    return running.current;
  }, [run]);

  const queue = useCallback(
    (patch: Partial<T>) => {
      pending.current = { ...pending.current, ...patch };
      if (!running.current) setStatus("unsaved");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), delayMs);
    },
    [flush, delayMs],
  );

  useEffect(() => {
    const hasUnsaved = () =>
      running.current !== null || Object.keys(pending.current).length > 0;
    const warn = (e: BeforeUnloadEvent) => {
      if (hasUnsaved()) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      // In-app navigation away: send what is left instead of dropping it.
      void flush().then(() => onLeaveRef.current?.());
    };
  }, [flush]);

  return { status, error, queue, flush, retry: flush };
}
