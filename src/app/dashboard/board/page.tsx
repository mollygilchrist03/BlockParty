import Link from "next/link";
import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { assertNotDemo, requireNeighborhoodUser, requireUser } from "@/lib/session";
import { boardOnlyRoles } from "@/lib/roles";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

const categories = [
  { value: "yard_sale", label: "Yard sale" },
  { value: "lost_and_found", label: "Lost & found" },
  { value: "recommendation", label: "Recommendation" },
  { value: "general", label: "General" },
] as const;

const categoryLabels = Object.fromEntries(
  categories.map((c) => [c.value, c.label]),
);

async function deletePost(postId: string) {
  "use server";

  const user = await requireUser();
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) return;

  const canDelete = post.authorId === user.id || boardOnlyRoles.includes(user.role);
  if (!canDelete) return;
  assertNotDemo(user, "/dashboard/board");

  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath("/dashboard/board");
}

export default async function BulletinBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; error?: string }>;
}) {
  const user = await requireNeighborhoodUser();
  const { category, error } = await searchParams;

  const activeCategory = categories.find((c) => c.value === category)?.value;

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      category: posts.category,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
    })
    .from(posts)
    .where(
      activeCategory
        ? and(eq(posts.neighborhoodId, user.neighborhoodId), eq(posts.category, activeCategory))
        : eq(posts.neighborhoodId, user.neighborhoodId),
    )
    .orderBy(desc(posts.createdAt));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Bulletin board</h1>
        <Link href="/dashboard/board/new" className="btn-primary">
          New post
        </Link>
      </div>

      <DemoReadonlyBanner error={error} />

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/dashboard/board"
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            !activeCategory
              ? "bg-navy text-white"
              : "border border-slate/20 bg-white text-slate hover:border-sage hover:text-sage"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.value}
            href={`/dashboard/board?category=${c.value}`}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              activeCategory === c.value
                ? "bg-navy text-white"
                : "border border-slate/20 bg-white text-slate hover:border-sage hover:text-sage"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-slate">No posts yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((post) => {
            const canDelete =
              post.authorId === user.id || boardOnlyRoles.includes(user.role);
            return (
              <li key={post.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block rounded-full bg-sage-light px-2 py-0.5 text-xs font-medium text-sage">
                      {categoryLabels[post.category]}
                    </span>
                    <h2 className="mt-2 font-semibold text-navy">{post.title}</h2>
                  </div>
                  <time className="shrink-0 text-xs text-muted">
                    {post.createdAt.toLocaleDateString()}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-slate">{post.body}</p>
                {canDelete && (
                  <form action={deletePost.bind(null, post.id)} className="mt-3">
                    <button
                      type="submit"
                      className="text-xs font-medium text-muted hover:text-red-600"
                    >
                      Delete
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
