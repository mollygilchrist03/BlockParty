import { postCategoryEnum } from "@/db/schema";

export const postCategoryLabels: Record<
  (typeof postCategoryEnum.enumValues)[number],
  string
> = {
  yard_sale: "Yard sale",
  lost_and_found: "Lost & found",
  recommendation: "Recommendation",
  general: "General",
};
