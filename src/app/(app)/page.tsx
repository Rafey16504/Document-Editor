import { getCurrentUser } from "@/server/session";

// Placeholder until the documents dashboard lands in session 2.
export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Logged in as {user?.name}</h1>
      <p className="mt-2 text-neutral-600">Your documents will appear here.</p>
    </div>
  );
}
