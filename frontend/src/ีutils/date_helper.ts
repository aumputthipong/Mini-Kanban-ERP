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