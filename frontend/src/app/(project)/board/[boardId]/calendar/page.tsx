import { ProjectCalendar } from "@/components/board/calendar/ProjectCalendar";

export default function CalendarPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-in-out mt-6">
      {/* ดึง Component Dashboard มาแสดง */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
          
      <ProjectCalendar />
   </div>
    </div>
  );
}