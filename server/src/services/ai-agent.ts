import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { allTools } from '../tools/definitions';
import { executeTool } from '../tools/handlers';
import { supabaseAdmin } from './supabase';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 4096;
const MAX_TOOL_ROUNDS = 10;

interface AgentOptions {
  userId: string;
  userClient: SupabaseClient;
  userMessage: string;
  onEvent: (event: SSEEvent) => void;
}

export type SSEEvent =
  | { type: 'text_delta'; content: string }
  | { type: 'tool_call'; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; name: string; result: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

function buildSystemPrompt(
  displayName: string,
  timezone: string,
): string {
  const now = new Date().toISOString();
  return `You are TaskPilot, an AI assistant that helps manage tasks AND takes real-world actions.

## About You
- You manage the user's tasks on a Kanban board (To Do → In Progress → Done)
- You can send emails, create calendar events, search the web, check weather, and more
- You can create automatable tasks that you'll execute later at a scheduled time
- You track everything you do in an activity log

## User Context
- Name: ${displayName || 'User'}
- Timezone: ${timezone || 'UTC'}
- Current time: ${now}

## Guidelines
- Be concise and helpful. Confirm actions after completing them.
- When creating tasks, intelligently set priority and suggest due dates when appropriate.
- For email/calendar actions, confirm with the user before executing unless they've been explicit.
- If a task can be automated (email, calendar event, research, document), set is_automatable=true and the appropriate action_type.
- When scheduling tasks for auto-execution, use auto_execute_at with the correct timezone.
- For translate_text, you handle the translation directly — the tool just provides the text.
- For generate_document, first call the tool, then generate the content yourself and use update_task to save it.
- For schedule_optimizer, focus_mode, suggest_tasks, estimate_time, and find_conflicts — the tool returns data for you to analyze and present insights.
- Always be proactive: if the user mentions a deadline, suggest setting a reminder. If they mention a meeting, offer to create a calendar event.`;
}

/**
 * Run the AI agent loop. Streams events via the onEvent callback.
 * Returns the final assistant text and tool calls for saving to chat history.
 */
export async function runAgent(options: AgentOptions): Promise<{
  assistantText: string;
  toolCalls: Array<{ name: string; input: Record<string, unknown>; result: string }>;
}> {
  const { userId, userClient, userMessage, onEvent } = options;

  // Load user profile for system prompt
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('display_name, full_name, timezone')
    .eq('id', userId)
    .single();

  const displayName = profile?.display_name || profile?.full_name || 'User';
  const timezone = profile?.timezone || 'UTC';

  // Load chat history
  const { data: history } = await supabaseAdmin
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(50);

  // Build messages array
  const messages: Anthropic.MessageParam[] = [];

  if (history) {
    for (const msg of history) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }
  }

  messages.push({ role: 'user', content: userMessage });

  // Save user message to DB
  await supabaseAdmin.from('chat_messages').insert({
    user_id: userId,
    role: 'user',
    content: userMessage,
  });

  const systemPrompt = buildSystemPrompt(displayName, timezone);
  const allToolCalls: Array<{ name: string; input: Record<string, unknown>; result: string }> = [];

  // Tool-use loop
  let rounds = 0;
  let finalText = '';

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: allTools,
      messages,
    });

    // Extract text and tool_use blocks
    const textBlocks: string[] = [];
    const toolUseBlocks: Array<{
      id: string;
      name: string;
      input: Record<string, unknown>;
    }> = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        textBlocks.push(block.text);
      } else if (block.type === 'tool_use') {
        toolUseBlocks.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    // Stream any text content
    const text = textBlocks.join('');
    if (text) {
      onEvent({ type: 'text_delta', content: text });
      finalText += text;
    }

    // If no tool calls, we're done
    if (toolUseBlocks.length === 0) {
      break;
    }

    // Add assistant response to messages
    messages.push({ role: 'assistant', content: response.content });

    // Execute tool calls
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolCall of toolUseBlocks) {
      onEvent({ type: 'tool_call', name: toolCall.name, input: toolCall.input });

      let result: string;
      try {
        result = await executeTool(toolCall.name, toolCall.input, {
          userId,
          userClient,
        });
      } catch (err) {
        result = JSON.stringify({
          error: err instanceof Error ? err.message : 'Tool execution failed',
        });
      }

      onEvent({ type: 'tool_result', name: toolCall.name, result });
      allToolCalls.push({ name: toolCall.name, input: toolCall.input, result });

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolCall.id,
        content: result,
      });
    }

    // Add tool results to messages
    messages.push({ role: 'user', content: toolResults });

    // If Claude indicated it's done (end_turn), the next iteration will return text-only
    if (response.stop_reason === 'end_turn') {
      break;
    }
  }

  onEvent({ type: 'done' });

  // Save assistant response to DB
  await supabaseAdmin.from('chat_messages').insert({
    user_id: userId,
    role: 'assistant',
    content: finalText,
    tool_calls: allToolCalls.length > 0 ? allToolCalls : null,
  });

  return { assistantText: finalText, toolCalls: allToolCalls };
}
