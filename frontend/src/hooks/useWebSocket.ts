"use client";
import { useBoardStore } from '@/store/useBoardStore';
import { useEffect, useRef, useCallback } from 'react';


export interface WebSocketMessage {
  type: string;
  payload: any;
}

export const useWebSocket = (url: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const isConnecting = useRef(false);

useEffect(() => {
    // 1. Guard ป้องกัน URL ไม่พร้อม
    if (!url || url.endsWith('undefined') || url.endsWith('null') || url.endsWith('/')) {
      return; 
    }

    let isCancelled = false; // Flag พระเอกของเรา

    console.log("🎯 Attempting to connect WebSocket to:", url);
    isConnecting.current = true;
    
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      if (isCancelled) {
        socket.close();
        return;
      }
      console.log('✅ Connected to Go WebSocket');
      isConnecting.current = false;
    };

    socket.onmessage = (event) => {
      if (isCancelled) return; // ถ้ายกเลิกแล้ว ห้ามประมวลผลข้อความ
      try {
        const parsedData = JSON.parse(event.data);
        console.log('📩 Message from server:', parsedData);

        if (parsedData.type === 'CARD_MOVED') {
          const { card_id, old_column_id, new_column_id } = parsedData.payload;
          useBoardStore.getState().moveCard(card_id, old_column_id, new_column_id);
        }

        if (parsedData.type === 'CARD_CREATED') {
          useBoardStore.getState().addCardToStore(parsedData.payload);
        }

        if (parsedData.type === 'CARD_DELETED') {
          useBoardStore.getState().removeCardFromStore(parsedData.payload.card_id);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      // [แก้บั๊กที่นี่!]: ถ้าถูกสั่ง Cancel ไปแล้ว ห้ามเอา null ไปทับของใหม่เด็ดขาด!
      if (isCancelled) return; 
      
      console.log('🛑 Disconnected from WebSocket');
      socketRef.current = null;
      isConnecting.current = false;
    };

    socket.onerror = (error) => {
      // [แก้บั๊กที่นี่!]: ไม่แสดง Error และไม่เคลียร์ค่า ถ้ามันคือ socket ที่เราจงใจปิดเอง
      if (isCancelled) return;

      console.error('❌ WebSocket encountered an error.');
      isConnecting.current = false;
    };

    return () => {
      // เมื่อ Component ถูกทำลาย (เช่น กดกลับหน้า Dashboard)
      isCancelled = true; 
      
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      
      // [ป้องกันชั้นที่ 2]: เคลียร์ค่า Ref เฉพาะกรณีที่ Ref นั้นยังชี้มาที่ socket ตัวเก่านี้เท่านั้น
      if (socketRef.current === socket) {
        socketRef.current = null;
        isConnecting.current = false;
      }
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