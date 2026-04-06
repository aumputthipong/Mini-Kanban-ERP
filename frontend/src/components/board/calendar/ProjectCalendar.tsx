"use client";

import { useState } from "react";
import { useBoardStore } from "@/store/useBoardStore";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
} from "date-fns";

export function ProjectCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // ดึงข้อมูล column ทั้งหมดจาก Store
  const columns = useBoardStore((state) => state.columns);

  // รวบรวม Card ทั้งหมด และกรองเอาเฉพาะที่มี due_date
  const tasksWithDueDate = columns
    .flatMap((col) => col.cards)
    .filter((card) => card.due_date);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={20} className="text-slate-600" />
          </button>
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

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] p-2 border-r border-b border-slate-200 transition-colors ${
              !isSameMonth(day, monthStart)
                ? "bg-slate-50/50 text-slate-400"
                : "bg-white text-slate-800"
            }`}
          >
            <div className="flex justify-end mb-1">
              <span
                className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isSameDay(day, new Date())
                    ? "bg-blue-500 text-white"
                    : "text-slate-700"
                }`}
              >
                {formattedDate}
              </span>
            </div>
            
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`text-xs px-2 py-1 rounded truncate cursor-pointer transition-colors ${
                    task.is_done
                      ? "bg-emerald-50 text-emerald-600 line-through border border-emerald-100"
                      : "bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                  }`}
                >
                  {task.title}
                </div>
              ))}
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