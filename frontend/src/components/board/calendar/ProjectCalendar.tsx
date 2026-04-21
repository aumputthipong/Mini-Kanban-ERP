"use client";

import { useState, useMemo } from "react";
import { useBoardStore } from "@/store/useBoardStore";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  setMonth,
  setYear,
  getMonth,
  getYear,
} from "date-fns";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ProjectCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  // ดึงข้อมูล column ทั้งหมดจาก Store
  const columns = useBoardStore((state) => state.columns);

  // รวบรวม Card ทั้งหมด และกรองเอาเฉพาะที่มี due_date
  const tasksWithDueDate = columns
    .flatMap((col) => col.cards)
    .filter((card) => card.due_date);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const yearOptions = useMemo(() => {
    const thisYear = getYear(today);
    return Array.from({ length: 11 }, (_, i) => thisYear - 5 + i);
  }, [today]);

  const isViewingCurrentMonth = isSameMonth(currentDate, today);

  const renderHeader = () => {
    return (
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            <CalendarDays size={13} className="text-slate-400" />
            Today: {format(today, "d MMM yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Select month"
            value={getMonth(currentDate)}
            onChange={(e) => setCurrentDate(setMonth(currentDate, Number(e.target.value)))}
            className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors cursor-pointer"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx}>{name}</option>
            ))}
          </select>
          <select
            aria-label="Select year"
            value={getYear(currentDate)}
            onChange={(e) => setCurrentDate(setYear(currentDate, Number(e.target.value)))}
            className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors cursor-pointer"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={goToToday}
            disabled={isViewingCurrentMonth}
            className="text-sm font-medium px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-600 text-slate-600"
          >
            Today
          </button>
          <div className="flex gap-1">
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={18} className="text-slate-600" />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={18} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDaysOfWeek = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 border-t border-l border-slate-200 bg-slate-50 rounded-t-lg overflow-hidden">
        {days.map((day, index) => (
          <div
            key={index}
            className="py-2 text-center text-sm font-semibold text-slate-600 border-r border-b border-slate-200"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;

        // ค้นหางานที่ due_date ตรงกับวันที่กำลัง render
        const dayTasks = tasksWithDueDate.filter((task) => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          return isSameDay(taskDate, cloneDay);
        });

        const isToday = isSameDay(day, today);
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const inCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] p-2 border-r border-b border-slate-200 transition-colors ${
              !inCurrentMonth
                ? "bg-slate-50/50 text-slate-400"
                : isToday
                ? "bg-blue-50/60 text-slate-800 ring-1 ring-inset ring-blue-300"
                : isWeekend
                ? "bg-slate-50/30 text-slate-700"
                : "bg-white text-slate-800"
            }`}
          >
            <div className="flex justify-end mb-1">
              <span
                className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                  isToday
                    ? "bg-blue-600 text-white shadow-sm"
                    : !inCurrentMonth
                    ? "text-slate-400"
                    : "text-slate-700"
                }`}
              >
                {formattedDate}
              </span>
            </div>
            
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
              {dayTasks.map((task) => {
                // Classify the task so overdue/due-today/due-soon are visually distinct
                // from regular upcoming or completed tasks.
                const dayStart = new Date(cloneDay);
                dayStart.setHours(0, 0, 0, 0);
                const todayStart = new Date(today);
                todayStart.setHours(0, 0, 0, 0);
                const daysFromToday = Math.round(
                  (dayStart.getTime() - todayStart.getTime()) / 86400000,
                );
                let cls = "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100";
                let badge: string | null = null;
                if (task.is_done) {
                  cls = "bg-emerald-50 text-emerald-600 line-through border-emerald-100";
                } else if (daysFromToday < 0) {
                  cls = "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-medium";
                  badge = "Overdue";
                } else if (daysFromToday === 0) {
                  cls = "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-medium";
                  badge = "Today";
                } else if (daysFromToday <= 3) {
                  cls = "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100";
                  badge = "Soon";
                }
                return (
                  <div
                    key={task.id}
                    title={`${task.title}${badge ? ` · ${badge}` : ""}`}
                    className={`text-xs px-2 py-1 rounded truncate cursor-pointer transition-colors border flex items-center gap-1 ${cls}`}
                  >
                    {badge && !task.is_done && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            badge === "Overdue"
                              ? "#e11d48"
                              : badge === "Today"
                              ? "#d97706"
                              : "#ea580c",
                        }}
                      />
                    )}
                    <span className="truncate">{task.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      
      rows.push(
        <div className="grid grid-cols-7 border-l border-slate-200" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      {renderHeader()}
      <div className="flex flex-col">
        {renderDaysOfWeek()}
        {renderCells()}
      </div>
    </div>
  );
}