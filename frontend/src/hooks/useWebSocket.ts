"use client";
import { useEffect, useRef, useCallback } from 'react';


export interface WebSocketMessage {
  type: string;
  payload: any;
}

export const useWebSocket = (url: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const isConnecting = useRef(false);
  useEffect(() => {
    // ถ้ากำลังเชื่อมต่ออยู่ หรือมี Socket แล้ว ให้ข้ามไปเลย ไม่ต้องสร้างใหม่
    if (isConnecting.current || socketRef.current) return;

    isConnecting.current = true;
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to Go WebSocket ✅');
      isConnecting.current = false;
    };

    socket.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };

    socket.onclose = () => {
      console.log('Disconnected from WebSocket ❌');
      socketRef.current = null;
      isConnecting.current = false;
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      isConnecting.current = false;
    };

    // Cleanup function
    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      socketRef.current = null;
      isConnecting.current = false;
    };
  }, [url]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  return { sendMessage };
};