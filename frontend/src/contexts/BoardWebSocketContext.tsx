"use client";
import { createContext, useContext } from "react";
import { useWebSocket, WebSocketMessage } from "@/hooks/useWebSocket";
import { WS_URL } from "@/lib/constants";

interface BoardWebSocketContextValue {
  sendMessage: (msg: WebSocketMessage) => void;
}

const BoardWebSocketContext = createContext<BoardWebSocketContextValue | null>(null);

/**
 * Wraps `useWebSocket` so any descendant of the board page can call
 * `sendMessage` without re-instantiating the socket. Mount this once at the
 * board route layout — children get a stable `sendMessage` reference.
 *
 * The hook itself manages reconnection + dispatch into Zustand stores. This
 * provider only exposes the *outbound* channel — inbound messages bypass
 * context entirely and mutate stores directly (see `useWebSocket`).
 */
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

/**
 * Read the active board's outbound WS channel. Throws if used outside a
 * `<BoardWebSocketProvider>` — that's intentional; calling `sendMessage`
 * with no socket would silently swallow the action.
 */
export function useBoardWebSocket() {
  const ctx = useContext(BoardWebSocketContext);
  if (!ctx) throw new Error("useBoardWebSocket must be used inside BoardWebSocketProvider");
  return ctx;
}
