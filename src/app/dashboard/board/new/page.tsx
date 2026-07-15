import { redirect } from "next/navigation";
import { db } from "@/db";
import { postCategoryEnum, posts } from "@/db/schema";
import { assertNotDemo, requireUser } from "@/lib/session";
import { postCategoryLabels } from "@/lib/posts";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

// "General" first, as the sensible default for a new post — everywhere
// else (the board's filter chips) follows the schema's declared order.
const categoryOrder: (typeof postCategoryEnum.enumValues)[number][] = [
  "general",
  "yard_sale",
  "lost_and_found",
  "recommendation",
];
const categories = categoryOrder.map((value) => ({
  value,
  label: postCategoryLabels[value],
}));

async function createPost(formData: FormData) {
  "use server";

  const user = await requireUser();
  assertNotDemo(user, "/dashboard/board/new");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "general");

  if (
    !title ||
    !body ||
    !user.neighborhoodId ||
    !postCategoryEnum.enumValues.includes(category as (typeof postCategoryEnum.enumValues)[number])
  ) {
    return;
  }

  await db.insert(posts).values({
    neighborhoodId: user.neighborhoodId,
    authorId: user.id,
    category: category as (typeof postCategoryEnum.enumValues)[number],
    title,
    body,
  });

  redirect("/dashboard/board");
}

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">New post</h1>
      <DemoReadonlyBanner error={error} />
      <form action={createPost} className="card flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate">
          Category
          <select name="category" defaultValue="general" className="field">
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Title
          <input type="text" name="title" required className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Details
          <textarea name="body" required rows={6} className="field" />
        </label>
        <button type="submit" className="btn-primary self-start">
          Post
        </button>
      </form>
    </div>
  );
}
