import { useEffect, useRef, useCallback, useState } from 'react';
import { Request } from '../api/client';

export interface SSEEvent {
  type: string;
  data: {
    id: number;
    endpoint_id: number;
    method: string;
    headers: Record<string, string>;
    body: string;
    query_params: string;
    source_ip: string;
    content_type: string;
    received_at: string;
    endpoint_slug: string;
    endpoint_name: string;
  };
}

export function useSSE(onNewRequest: (request: Request & { endpoint_slug: string; endpoint_name: string }) => void) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/sse');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      console.log('SSE connected');
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();

      // Reconnect after 3 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = window.setTimeout(() => {
        console.log('SSE reconnecting...');
        connect();
      }, 3000);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        if (data.type === 'new_request') {
          onNewRequest(data.data);
        }
      } catch (e) {
        console.error('Failed to parse SSE event:', e);
      }
    };
  }, [onNewRequest]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { connected };
}
