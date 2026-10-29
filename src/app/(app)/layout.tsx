import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { requirePageUser } from "@/server/session";

// Pages guard themselves too; API routes enforce auth via requireUser().
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requirePageUser();

  return (
    <>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="font-semibold">
            Ajaia Docs
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-600">{user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
    </>
  );
}
