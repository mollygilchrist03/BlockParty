export function DemoReadonlyBanner({ error }: { error?: string }) {
  if (error !== "demo-readonly") return null;

  return (
    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
      This is a public demo account, so changes are disabled. Clone the
      repo and run your own instance to try this for real.
    </p>
  );
}
