#!/usr/bin/env node
// PreToolUse hook: blocks git commands that write (commit, push, add, reset, ...).
// The user handles git themselves (see docs/CODING_PRACTICES.md). Exit 2 = block.

const READ_ONLY = new Set([
  "status", "log", "diff", "show", "rev-parse", "ls-files", "ls-tree", "blame",
  "describe", "shortlog", "grep", "cat-file", "reflog", "version", "help",
  "--version", "--help",
]);

// Allowed only when every argument is one of these listing flags.
const LIST_ONLY = {
  branch: /^(-a|-r|-v|-vv|--all|--remotes|--list|--show-current|--verbose)$/,
  tag: /^(-l|--list)$/,
  remote: /^(-v|--verbose|show|get-url)$/,
  stash: /^(list|show)$/,
  config: /^(--get|--get-all|--list|-l)$/,
};

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
  });
}

// Returns the first write-capable git invocation found in the command, or null.
function findGitWrite(command) {
  // Split on shell separators so each segment is checked on its own.
  const segments = command.split(/&&|\|\||;|\||\n/);
  for (const seg of segments) {
    const m = seg.match(/(?:^|[\s"'(&`])git(?:\.exe)?\s+(.*)$/i);
    if (!m) continue;
    const tokens = m[1].trim().split(/\s+/).filter(Boolean);
    // Skip global options like -C <path>, -c k=v, --no-pager.
    let i = 0;
    while (i < tokens.length && tokens[i].startsWith("-") && !READ_ONLY.has(tokens[i])) {
      if (tokens[i] === "-C" || tokens[i] === "-c") i++;
      i++;
    }
    const sub = (tokens[i] || "").toLowerCase();
    if (!sub || READ_ONLY.has(sub)) continue;
    const listRule = LIST_ONLY[sub];
    const args = tokens.slice(i + 1);
    // Bare `git stash` / `git config` (no args) write or are ambiguous, so they need an explicit listing arg.
    const needsArg = sub === "stash" || sub === "config";
    if (listRule && (args.length > 0 || !needsArg) && args.every((t) => listRule.test(t))) continue;
    return `git ${tokens.slice(i).join(" ")}`.trim();
  }
  return null;
}

(async () => {
  try {
    const input = JSON.parse(await readStdin());
    const command = input?.tool_input?.command;
    if (typeof command !== "string") process.exit(0);
    const hit = findGitWrite(command);
    if (hit) {
      process.stderr.write(
        `Blocked by git-guard: "${hit}" modifies the repository. ` +
          "The user handles all git write operations; only read-only git commands are allowed. " +
          "Tell the user which git command to run instead.\n"
      );
      process.exit(2);
    }
    process.exit(0);
  } catch {
    // Never block on a parse failure of the hook input itself.
    process.exit(0);
  }
})();
