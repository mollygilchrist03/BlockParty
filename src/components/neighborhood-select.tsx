export function NeighborhoodSelect({
  neighborhoodId,
  options,
}: {
  neighborhoodId: string | null;
  options: { id: string; name: string }[];
}) {
  if (neighborhoodId) return null;

  return (
    <label className="flex flex-col gap-1 text-sm text-slate">
      Neighborhood
      <select name="neighborhoodId" required className="field">
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
