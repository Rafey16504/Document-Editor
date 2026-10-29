import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, name: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(
    page.getByRole("heading", { name: "My documents" }),
  ).toBeVisible();
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** Waits for the autosave PATCH that the given action triggers. */
async function saved(page: Page, action: () => Promise<void>) {
  const response = page.waitForResponse(
    (r) =>
      r.request().method() === "PATCH" && r.url().includes("/api/documents/"),
  );
  await action();
  expect((await response).ok()).toBe(true);
  await expect(page.getByText("All changes saved")).toBeVisible();
}

test("create, edit, share, and the second user sees it", async ({ page }) => {
  const title = `Smoke ${Date.now()}`;

  await login(page, "Alice");
  await page.getByRole("button", { name: "New document" }).click();
  await expect(page).toHaveURL(/\/documents\/[\w-]+$/);
  const docUrl = page.url();

  const editor = page.getByLabel("Document content");
  const toolbar = page.getByRole("toolbar", { name: "Formatting" });
  await expect(toolbar).toBeVisible();
  await saved(page, async () => {
    await page.getByLabel("Document title").fill(title);
    await editor.click();
    await page.getByRole("button", { name: "Bold" }).click();
    await editor.pressSequentially("Hello Bob");
  });

  // Formatting survives a reload.
  await page.reload();
  await expect(editor.locator("strong")).toHaveText("Hello Bob");
  await expect(page.getByLabel("Document title")).toHaveValue(title);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export .md" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe(`${title}.md`);
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  expect(Buffer.concat(chunks).toString("utf8")).toBe("**Hello Bob**\n");

  await page.getByRole("button", { name: "Share" }).click();
  const dialog = page.getByRole("dialog", { name: "Share document" });
  await dialog.getByLabel("Email address").fill("bob@ajaia.dev");
  await dialog.getByLabel("Role", { exact: true }).selectOption("editor");
  await dialog.getByRole("button", { name: "Share" }).click();
  await expect(dialog.getByText("bob@ajaia.dev")).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();

  await page.goto("/");
  await expect(
    page.getByRole("link", { name: new RegExp(title) }),
  ).toBeVisible();
  await logout(page);

  await login(page, "Bob");
  const sharedItem = page
    .getByRole("listitem")
    .filter({ hasText: title })
    .filter({ hasText: "Owned by Alice" });
  await expect(sharedItem.getByText("Can edit")).toBeVisible();
  await sharedItem.getByRole("link").click();

  await expect(page).toHaveURL(docUrl);
  await expect(editor.locator("strong")).toHaveText("Hello Bob");
  // Toolbar is there before Bob clicks anything (regression check).
  await expect(toolbar).toBeVisible();
  await saved(page, async () => {
    await editor.click();
    await page.keyboard.press("End");
    await editor.pressSequentially(" and Alice");
  });
  await page.reload();
  await expect(editor).toContainText("Hello Bob and Alice");
});

test("import a Markdown file into an editable document", async ({ page }) => {
  await login(page, "Carol");

  await page
    .getByLabel("Import file")
    .setInputFiles("tests/fixtures/sample.md");
  await expect(page).toHaveURL(/\/documents\/[\w-]+$/);
  await expect(page.getByLabel("Document title")).toHaveValue("sample");
  const editor = page.getByLabel("Document content");
  await expect(
    editor.getByRole("heading", { name: "Release notes" }),
  ).toBeVisible();
  await expect(editor.locator("strong")).toHaveText("bold");
});

test("error and empty states", async ({ page }) => {
  await login(page, "Carol");

  // Unsupported type is rejected in the browser with a clear message.
  await page.getByLabel("Import file").setInputFiles({
    name: "scan.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4"),
  });
  await expect(
    page.getByText("Unsupported file type. Use .txt, .md or .docx"),
  ).toBeVisible();

  // An empty file passes the browser check and gets the server's error.
  await page.getByLabel("Import file").setInputFiles({
    name: "empty.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("  \n\n"),
  });
  await expect(page.getByText("File is empty")).toBeVisible();

  // Nothing is shared with Carol.
  await expect(page.getByText("Nothing shared with you yet")).toBeVisible();

  // Unknown documents show the in-app not-found page.
  await page.goto("/documents/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "Document not found" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to my documents" }).click();
  await expect(
    page.getByRole("heading", { name: "My documents" }),
  ).toBeVisible();
});

test("logged-out visitors are sent to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
