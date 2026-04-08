// MemberFilterBar.tsx
import { useBoardStore } from "@/store/useBoardStore";
import { useState, useRef, useEffect } from "react";

export function MemberFilterBar() {
  const AVATAR_COLORS = [
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];

  function avatarColor(userId: string) {
    const idx = userId.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  }
  const { boardMembers, currentUserId, filterAssigneeId, setFilterAssigneeId } =
    useBoardStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = (userId: string) => {
    setFilterAssigneeId(filterAssigneeId === userId ? null : userId);
  };

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortedMembers = [...boardMembers].sort((a, b) => {
    if (a.user_id === currentUserId) return -1;
    if (b.user_id === currentUserId) return 1;
    return 0;
  });

  const MAX_DISPLAY = 3;
  const visibleMembers = sortedMembers.slice(0, MAX_DISPLAY);
  const hiddenMembers = sortedMembers.slice(MAX_DISPLAY); // เปลี่ยนจาก hiddenCount เป็น array
  const isFiltering = filterAssigneeId !== null;

  return (
    <div className="flex items-center gap-2">
      {/* ปุ่ม All */}
      <button
        onClick={() => setFilterAssigneeId(null)}
        className={`px-3 h-7 text-xs font-medium rounded-full border transition-colors ${
          filterAssigneeId === null
            ? "bg-slate-800 text-white border-slate-800"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
        }`}
      >
        All
      </button>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      <div className="flex items-center gap-1.5">
        {visibleMembers.map((member) => {
          const isActive = filterAssigneeId === member.user_id;
          const isMe = member.user_id === currentUserId;
          const isMuted = isFiltering && !isActive;
          const initial = member.full_name?.charAt(0).toUpperCase() ?? "?";
          const color = avatarColor(member.user_id);

          return (
            <button
              key={member.user_id}
              onClick={() => toggle(member.user_id)}
              title={member.full_name + (isMe ? " (Me)" : "")}
              className={`relative flex items-center justify-center w-7 h-7 rounded-full text-white text-[11px] font-bold transition-all duration-200
                ${color}
                ${isActive ? "ring-2 ring-offset-1 ring-blue-500 scale-110 z-10 shadow-md" : "hover:scale-105 hover:z-10"}
                ${isMuted ? "opacity-30 grayscale hover:opacity-80" : "opacity-100"}
              `}
            >
              {initial}
              {isMe && (
                <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 font-normal whitespace-nowrap">
                  Me
                </span>
              )}
            </button>
          );
        })}

        {/* Overflow button + Dropdown */}
        {hiddenMembers.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`flex items-center justify-center gap-0.5 h-7 px-2 rounded-full text-[10px] font-bold border transition-all cursor-pointer
    ${
      isDropdownOpen
        ? "bg-slate-800 text-white border-slate-800"
        : "bg-white text-slate-500 border-slate-300 hover:border-slate-500 hover:text-slate-700"
    }
    ${isFiltering ? "opacity-30 grayscale" : ""}
  `}
              title={`+${hiddenMembers.length} more members`}
            >
              +{hiddenMembers.length}
              <svg
                className={`w-2.5 h-2.5 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                viewBox="0 0 10 10"
                fill="currentColor"
              >
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute top-9 right-0 z-50 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                {hiddenMembers.map((member) => {
                  const isActive = filterAssigneeId === member.user_id;
                  const initial =
                    member.full_name?.charAt(0).toUpperCase() ?? "?";
                  const color = avatarColor(member.user_id);

                  return (
                    <button
                      key={member.user_id}
                      onClick={() => {
                        toggle(member.user_id);
                        setIsDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors
                        ${isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-50"}
                      `}
                    >
                      <span
                        className={`flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold ${color}`}
                      >
                        {initial}
                      </span>
                      <span className="truncate">{member.full_name}</span>
                      {isActive && (
                        <span className="ml-auto text-blue-500">&#10003;</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
