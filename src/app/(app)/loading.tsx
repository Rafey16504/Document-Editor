// Shown while the dashboard or a document loads; the header from the layout stays.
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-neutral-200" />
      <div className="h-4 w-full max-w-md rounded bg-neutral-200" />
      <div className="h-40 rounded-lg border border-neutral-200 bg-white" />
    </div>
  );
}
