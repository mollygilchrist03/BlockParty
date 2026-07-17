"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/time-ago";

export function LiveTimeAgo({ date, initialText }: { date: Date; initialText: string }) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    const update = () => setText(timeAgo(date));
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [date]);

  return <>{text}</>;
}
