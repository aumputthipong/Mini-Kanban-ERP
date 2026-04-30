// Helper: คำนวณวันที่ล่าช้า (Overdue)
export const getOverdueText = (dueDateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Overdue by 1 day";
  return `Overdue by ${diffDays} days`;
};

// Helper: แปลงวันที่เป็นรูปแบบภาษาไทย (เช่น 1 เมษายน 2569)
export const formatThaiDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long", // ใช้ "short" ถ้าต้องการตัวย่อเช่น เม.ย.
    day: "numeric",
  });
};

export const getDaysRemainingText = (dueDateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `In ${diffDays} days`;
};

// Compact relative label suitable for dense list rows (My Tasks).
// Falls back to formatThaiDate if more than 7 days out.
export const formatRelativeDueDate = (dueDateStr: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return days === 1 ? "1 day overdue" : `${days} days overdue`;
  }
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return `In ${diffDays} days`;
  return formatThaiDate(dueDateStr);
};
