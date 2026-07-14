import Image from "next/image";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth, unstable_update } from "@/auth";
import { db } from "@/db";
import { neighborhoods, users } from "@/db/schema";

async function joinNeighborhood(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user || session.user.role !== "pending" || !session.user.email) {
    redirect("/login");
  }

  const neighborhoodId = String(formData.get("neighborhoodId") ?? "");
  if (!neighborhoodId) return;

  const [chosen] = await db
    .select({ id: neighborhoods.id })
    .from(neighborhoods)
    .where(eq(neighborhoods.id, neighborhoodId))
    .limit(1);
  if (!chosen) return;

  const [newUser] = await db
    .insert(users)
    .values({
      neighborhoodId: chosen.id,
      name: session.user.name ?? "New resident",
      email: session.user.email.toLowerCase(),
      role: "resident",
    })
    .returning();

  await unstable_update({
    user: {
      id: newUser.id,
      role: "resident",
      neighborhoodId: newUser.neighborhoodId,
    },
  });

  redirect("/dashboard");
}

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "pending") redirect("/login");

  const options = await db
    .select({ id: neighborhoods.id, name: neighborhoods.name })
    .from(neighborhoods)
    .orderBy(asc(neighborhoods.name));

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <Image src="/logo.svg" alt="" width={48} height={48} />
        <div className="text-center">
          <p className="eyebrow">One last step</p>
          <h1 className="mt-1 text-2xl font-semibold text-navy">
            Welcome, {session.user.name?.split(" ")[0] ?? "there"}! Which
            neighborhood do you live in?
          </h1>
        </div>

        <form action={joinNeighborhood} className="card w-full">
          {options.length === 0 ? (
            <p className="text-sm text-slate">
              No neighborhoods have been set up yet. Ask your HOA board to
              create one.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {options.map((option, index) => (
                <label key={option.id} className="group relative block cursor-pointer">
                  <input
                    type="radio"
                    name="neighborhoodId"
                    value={option.id}
                    defaultChecked={index === 0}
                    required
                    className="peer sr-only"
                  />
                  <div className="rounded-xl border border-slate/20 px-4 py-3 font-medium text-slate transition-colors peer-checked:border-sage peer-checked:bg-sage-light peer-checked:text-sage peer-focus-visible:ring-2 peer-focus-visible:ring-sage/30">
                    {option.name}
                  </div>
                </label>
              ))}
            </div>
          )}
          {options.length > 0 && (
            <button type="submit" className="btn-primary mt-5 w-full">
              Join neighborhood
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
