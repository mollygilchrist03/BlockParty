const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function nextPickupDate(
  dayOfWeek: number,
  frequency: "weekly" | "biweekly",
  anchorDate: Date,
  from: Date = new Date(),
): Date {
  const date = new Date(from);
  date.setHours(0, 0, 0, 0);

  while (date.getDay() !== dayOfWeek) {
    date.setDate(date.getDate() + 1);
  }

  if (frequency === "biweekly") {
    const anchor = new Date(anchorDate);
    anchor.setHours(0, 0, 0, 0);
    while (anchor.getDay() !== dayOfWeek) {
      anchor.setDate(anchor.getDate() + 1);
    }

    const weeksSinceAnchor = Math.round(
      (date.getTime() - anchor.getTime()) / (MS_PER_DAY * 7),
    );
    if (Math.abs(weeksSinceAnchor % 2) === 1) {
      date.setDate(date.getDate() + 7);
    }
  }

  return date;
}
