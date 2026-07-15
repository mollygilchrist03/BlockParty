import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { postCategoryEnum, posts } from "@/db/schema";
import { assertNotDemo, requireNeighborhoodUser, requireUser } from "@/lib/session";
import { boardOnlyRoles } from "@/lib/roles";
import { postCategoryLabels } from "@/lib/posts";
import { timeAgo } from "@/lib/time-ago";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

const categories = postCategoryEnum.enumValues.map((value) => ({
  value,
  label: postCategoryLabels[value],
}));

const categoryBadge: Record<(typeof postCategoryEnum.enumValues)[number], string> = {
  yard_sale: "bg-amber-50 text-amber-700",
  lost_and_found: "bg-blue-50 text-blue-700",
  recommendation: "bg-violet-50 text-violet-700",
  general: "bg-slate-100 text-slate",
};

const postIcon = (
  <>
    <path d="M20.59 13.41 11 3.83 3.83 11l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z" />
    <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
  </>
);

async function deletePost(postId: string) {
  "use server";

  const user = await requireUser();
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) return;

  if (post.neighborhoodId !== user.neighborhoodId) return;

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
      imageUrl: posts.imageUrl,
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Bulletin Board</h1>
        <Link href="/dashboard/board/new" className="btn-primary">
          + New Post
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
          All Posts
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((post) => {
            const canDelete = post.authorId === user.id || boardOnlyRoles.includes(user.role);
            return (
              <li key={post.id} className="card overflow-hidden !p-0">
                <div className="relative h-36 w-full bg-sage-light">
                  {post.imageUrl ? (
                    <Image src={post.imageUrl} alt="" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sage">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                        {postIcon}
                      </svg>
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${categoryBadge[post.category]}`}>
                    {postCategoryLabels[post.category]}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <h2 className="font-semibold text-navy">{post.title}</h2>
                  <p className="line-clamp-2 text-sm text-slate">{post.body}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">{timeAgo(post.createdAt)}</p>
                    {canDelete && (
                      <form action={deletePost.bind(null, post.id)}>
                        <button type="submit" className="text-xs font-medium text-muted hover:text-red-600">
                          Delete
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
