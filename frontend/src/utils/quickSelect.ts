export const QUICK_DATE_OPTIONS = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "3 Days", days: 3 },
  { label: "1 Week", days: 7 },
] as const;

export const QUICK_HOURS_OPTIONS = [
  { label: "1h", value: "1" },
  { label: "2h", value: "2" },
  { label: "4h", value: "4" },
  { label: "8h", value: "8" },
] as const;
