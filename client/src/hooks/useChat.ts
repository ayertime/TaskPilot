import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { API_URL } from '@/lib/api';
import type { ChatMessage } from '@/types';

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  result: string;
}

interface StreamingState {
  content: string;
  toolCalls: ToolCall[];
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState<StreamingState | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Load chat history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) return;

      const res = await fetch(`${API_URL}/api/chat/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } finally {
      setLoading(false);
    }
  }

  const sendMessage = useCallback(async (message: string) => {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) return;

    // Add user message optimistically
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: '',
      role: 'user',
      content: message,
      tool_calls: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Start streaming state
    const streamState: StreamingState = { content: '', toolCalls: [] };
    setStreaming(streamState);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to connect to AI agent');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          try {
            const event = JSON.parse(json);

            if (event.type === 'text_delta') {
              streamState.content += event.content;
              setStreaming({ ...streamState });
            } else if (event.type === 'tool_call') {
              streamState.toolCalls.push({
                name: event.name,
                input: event.input,
                result: '',
              });
              setStreaming({ ...streamState });
            } else if (event.type === 'tool_result') {
              const tc = streamState.toolCalls.find(
                (t) => t.name === event.name && !t.result,
              );
              if (tc) tc.result = event.result;
              setStreaming({ ...streamState });
            } else if (event.type === 'error') {
              streamState.content += `\n\nError: ${event.message}`;
              setStreaming({ ...streamState });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      // Stream complete — add assistant message
      const assistantMsg: ChatMessage = {
        id: `temp-${Date.now()}-assistant`,
        user_id: '',
        role: 'assistant',
        content: streamState.content,
        tool_calls: streamState.toolCalls.length > 0 ? streamState.toolCalls : null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Invalidate task and category caches since the agent may have modified them
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `temp-${Date.now()}-error`,
        user_id: '',
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        tool_calls: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setStreaming(null);
    }
  }, [queryClient]);

  const clearHistory = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) return;

      const res = await fetch(`${API_URL}/api/chat/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) setMessages([]);
    } catch {
      // Network error — don't clear local messages
    }
  }, []);

  return { messages, streaming, loading, sendMessage, clearHistory };
}
