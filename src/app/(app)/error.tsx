"use client";

import Link from "next/link";
import { useEffect } from "react";

// Server error messages are replaced by Next with a generic one, so show our own text.
export default function AppError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-8 text-center"
    >
      <h1 className="text-lg font-semibold text-red-800">
        Something went wrong
      </h1>
      <p className="mt-1 text-sm text-red-700">
        This page couldn&apos;t be loaded. Try again, or go back to your
        documents.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
        >
          My documents
        </Link>
      </div>
    </div>
  );
}
