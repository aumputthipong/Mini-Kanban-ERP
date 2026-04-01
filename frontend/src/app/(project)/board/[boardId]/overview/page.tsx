import { BoardDashboard } from "@/components/board/dashboard/BoardDashboard";

// Next.js Metadata (Optional: สำหรับตั้งชื่อ Title บน Tab Browser)
export const metadata = {
  title: "Overview | Project Board",
};

export default function OverviewPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-in-out">
      {/* ดึง Component Dashboard มาแสดง */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
      <BoardDashboard />
   </div>
    </div>
  );
}