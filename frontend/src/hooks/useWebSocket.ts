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
    if (!url || url.endsWith('undefined') || url.endsWith('null') || url.endsWith('/')) {
      return;
    }

    let isCancelled = false; 
    isConnecting.current = true;

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      if (isCancelled) {
        socket.close();
        return;
      }
      isConnecting.current = false;
    };

    socket.onmessage = (event) => {
      if (isCancelled) return; // ถ้ายกเลิกแล้ว ห้ามประมวลผลข้อความ
      try {
        const parsedData = JSON.parse(event.data);
        // console.log('Message from server:', parsedData);

        if (parsedData.type === 'CARD_MOVED') {
          const { card_id, new_column_id, position, is_done, completed_at } = parsedData.payload;
          useBoardStore.getState().moveCard(card_id, new_column_id, position, is_done, completed_at);
        }

        if (parsedData.type === 'CARD_CREATED') {
          useBoardStore.getState().addCardToStore(parsedData.payload);
        }

        if (parsedData.type === 'CARD_DELETED') {
          useBoardStore.getState().removeCardFromStore(parsedData.payload.card_id);
        }
        if (parsedData.type === 'CARD_UPDATED') {
          const { card_id, assignee_name, ...rest } = parsedData.payload;
          useBoardStore.getState().updateCard({
            id: card_id,
            assignee_name: assignee_name ?? null,
            ...rest,
          });
        }

        if (parsedData.type === 'COLUMN_CREATED') {
          const { id, title, position, category } = parsedData.payload;
          useBoardStore.getState().addColumnToStore({ id, title, position, category, cards: [] });
        }

        if (parsedData.type === 'COLUMN_RENAMED') {
          const { column_id, title } = parsedData.payload;
          useBoardStore.getState().renameColumnInStore(column_id, title);
        }

        if (parsedData.type === 'COLUMN_DELETED') {
          useBoardStore.getState().removeColumnFromStore(parsedData.payload.column_id);
        }

      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
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
    const ws = socketRef.current;
    const state = ws ? ws.readyState : -1;
    console.log('[WS sendMessage] type:', message.type, '| readyState:', state, '(0=CONNECTING,1=OPEN,2=CLOSING,3=CLOSED)');
    if (ws && state === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('[WS sendMessage] NOT sent — socket not open');
    }
  }, []);

  return { sendMessage };
};