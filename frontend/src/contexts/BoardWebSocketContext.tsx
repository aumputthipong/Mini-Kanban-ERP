"use client";
import { createContext, useContext } from "react";
import { useWebSocket, WebSocketMessage } from "@/hooks/useWebSocket";
import { WS_URL } from "@/lib/constants";

interface BoardWebSocketContextValue {
  sendMessage: (msg: WebSocketMessage) => void;
}

const BoardWebSocketContext = createContext<BoardWebSocketContextValue | null>(null);

export function BoardWebSocketProvider({
  boardId,
  children,
}: {
  boardId: string;
  children: React.ReactNode;
}) {
  const { sendMessage } = useWebSocket(`${WS_URL}/${boardId}`);
  return (
    <BoardWebSocketContext.Provider value={{ sendMessage }}>
      {children}
    </BoardWebSocketContext.Provider>
  );
}

export function useBoardWebSocket() {
  const ctx = useContext(BoardWebSocketContext);
  if (!ctx) throw new Error("useBoardWebSocket must be used inside BoardWebSocketProvider");
  return ctx;
}
