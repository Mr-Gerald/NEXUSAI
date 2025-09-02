import { useState, useRef, useCallback } from 'react';

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const WS_URL_BASE = `${protocol}://${window.location.host}`;

export const useWebSocket = (path: string) => {
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
  const ws = useRef<WebSocket | null>(null);
  // FIX: setTimeout in browser returns a number, not a NodeJS.Timeout object.
  const reconnectionTimeout = useRef<number | null>(null);

  const connect = useCallback((onOpen?: () => void) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      return;
    }
    
    // Clear any existing reconnection attempts
    if (reconnectionTimeout.current) {
        clearTimeout(reconnectionTimeout.current);
    }
    
    setReadyState(WebSocket.CONNECTING);
    const socket = new WebSocket(`${WS_URL_BASE}${path}`);
    ws.current = socket;

    socket.onopen = () => {
      console.log(`WebSocket connected to ${path}`);
      setReadyState(WebSocket.OPEN);
      if (onOpen) onOpen();
    };

    socket.onmessage = (event) => {
      setLastMessage(event);
    };

    socket.onclose = (event) => {
      if (!event.wasClean) {
          console.log(`WebSocket disconnected from ${path}. Reconnecting in 3s...`);
          setReadyState(WebSocket.CLOSED);
          reconnectionTimeout.current = window.setTimeout(() => connect(onOpen), 3000);
      } else {
          console.log(`WebSocket connection to ${path} closed cleanly.`);
          setReadyState(WebSocket.CLOSED);
      }
    };

    socket.onerror = (error) => {
      console.error(`WebSocket error on ${path}:`, error);
      // The onclose event will be fired, triggering reconnection logic.
      socket.close();
    };
  }, [path]);

  const disconnect = useCallback(() => {
    if (reconnectionTimeout.current) {
        clearTimeout(reconnectionTimeout.current);
    }
    if (ws.current) {
      ws.current.close(1000, 'User disconnected'); // 1000 indicates a normal closure
    }
  }, []);

  return { lastMessage, readyState, connect, disconnect };
};