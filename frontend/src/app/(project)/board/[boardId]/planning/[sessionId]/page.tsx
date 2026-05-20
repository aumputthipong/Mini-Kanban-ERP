"use client";

import { use } from "react";
import { SessionCaptureView } from "@/components/board/planning/SessionCaptureView";

interface SessionPageProps {
  params: Promise<{ boardId: string; sessionId: string }>;
}

export default function SessionPage({ params }: SessionPageProps) {
  const { boardId, sessionId } = use(params);
  return (
    <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-in-out">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <SessionCaptureView boardId={boardId} sessionId={sessionId} />
      </div>
    </div>
  );
}
