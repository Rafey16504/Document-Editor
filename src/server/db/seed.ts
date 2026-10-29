import "./load-env";
import { db } from "./client";
import { users } from "./schema";

const demoUsers = [
  { email: "alice@ajaia.dev", name: "Alice" },
  { email: "bob@ajaia.dev", name: "Bob" },
  { email: "carol@ajaia.dev", name: "Carol" },
];

async function main() {
  // Upsert on email so re-running keeps existing ids (and their documents).
  for (const user of demoUsers) {
    await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({ target: users.email, set: { name: user.name } });
  }
  console.log(`Seeded ${demoUsers.length} users`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
