import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/server/session";
import { listUsers } from "@/server/users";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  const users = await listUsers();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Ajaia Docs</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Demo login: pick a user to continue.
        </p>
        <LoginForm
          users={users.map(({ id, name, email }) => ({ id, name, email }))}
        />
      </div>
    </main>
  );
}
