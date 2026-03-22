import { useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat } from '@/hooks/useChat';
import { Trash2, Bot, Sparkles } from 'lucide-react';

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatPanel({ open, onOpenChange }: ChatPanelProps) {
  const { messages, streaming, sendMessage, clearHistory } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <SheetTitle className="text-base">TaskPilot AI</SheetTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearHistory}
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Sparkles className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm font-medium">How can I help?</p>
              <p className="text-xs mt-1 max-w-[250px]">
                I can manage your tasks, send emails, search the web, check the
                weather, and much more.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              toolCalls={msg.tool_calls as Array<{ name: string; input: Record<string, unknown>; result: string }> | undefined}
            />
          ))}

          {streaming && (
            <ChatMessage
              role="assistant"
              content={streaming.content}
              toolCalls={streaming.toolCalls}
              isStreaming
            />
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <ChatInput onSend={sendMessage} disabled={!!streaming} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
