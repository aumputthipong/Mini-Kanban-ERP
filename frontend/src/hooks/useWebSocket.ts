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
    // ถ้ากำลังเชื่อมต่ออยู่ หรือมี Socket แล้ว ให้ข้ามไปเลย ไม่ต้องสร้างใหม่
    if (isConnecting.current || socketRef.current) return;

    isConnecting.current = true;
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to Go WebSocket');
      isConnecting.current = false;
    };

    socket.onmessage = (event) => {
      // 2. ใช้ Try-Catch เสมอเมื่อจัดการกับ JSON เพื่อป้องกันแอปแครช
      try {
        const parsedData = JSON.parse(event.data);
        console.log('Message from server:', parsedData);

        // 3. ตรวจสอบประเภทของ Action
        if (parsedData.type === 'CARD_MOVED') {
          const { card_id, old_column_id, new_column_id } = parsedData.payload;
          
          // 4. เรียกใช้ moveCard จากนอก Component ผ่าน getState()
          // นี่คือ Best Practice ของ Zustand ในการเข้าถึง State จากไฟล์ Hook ทั่วไป
          useBoardStore.getState().moveCard(card_id, old_column_id, new_column_id);
        }

        if (parsedData.type === 'CARD_CREATED') {
          const newCard = parsedData.payload;
          
          // เราต้องไปเพิ่มฟังก์ชัน addCard ให้กับ Zustand Store ของเราด้วย
          useBoardStore.getState().addCardToStore(newCard);
        }
        

        if (parsedData.type === 'CARD_DELETED') {
          const { card_id } = parsedData.payload;
          useBoardStore.getState().removeCardFromStore(card_id);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from WebSocket');
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