import { useEffect, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { WS_URL } from '../services/api';

export function useWebSocket(topic, callback) {
  const [connected, setConnected] = useState(false);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const stableCallback = useCallback((...args) => {
    if (typeof callbackRef.current === 'function') callbackRef.current(...args);
  }, []);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(topic, (message) => {
          try { stableCallback(JSON.parse(message.body)); } catch { /* ignore malformed */ }
        });
      },
      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false),
      debug: () => {},
    });
    client.activate();
    return () => {
      try { client.deactivate(); } catch { /* already down */ }
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  return { connected };
}
