import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { allTools } from '../tools/definitions';
import { executeTool } from '../tools/handlers';
import { supabaseAdmin } from './supabase';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 4096;
const MAX_TOOL_ROUNDS = 10;

// --- Daily cost guardrail ---
const DAILY_COST_LIMIT = 1.00; // $1.00/day
const COST_PER_INPUT_TOKEN = 1.00 / 1_000_000;  // $1.00 per 1M tokens
const COST_PER_OUTPUT_TOKEN = 1.00 / 1_000_000;  // $1.00 per 1M tokens

let dailyCost = 0;
let costDate = new Date().toDateString();

function trackCost(inputTokens: number, outputTokens: number): void {
  const today = new Date().toDateString();
  if (today !== costDate) {
    dailyCost = 0;
    costDate = today;
  }
  dailyCost += (inputTokens * COST_PER_INPUT_TOKEN) + (outputTokens * COST_PER_OUTPUT_TOKEN);
}

function checkBudget(): { allowed: boolean; spent: number } {
  const today = new Date().toDateString();
  if (today !== costDate) {
    dailyCost = 0;
    costDate = today;
  }
  return { allowed: dailyCost < DAILY_COST_LIMIT, spent: dailyCost };
}

interface AgentOptions {
  userId: string;
  userClient: SupabaseClient;
  userMessage: string;
  onEvent: (event: SSEEvent) => void;
  /** When false, skip saving messages to chat_messages (used by scheduler). Defaults to true. */
  saveToHistory?: boolean;
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
  categories: { id: string; name: string }[] = [],
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
- For generate_morning_briefing, use the tool to get the user's topics, then use web_search for each topic to gather fresh news, and present a clean briefing with sections per topic.
- Always be proactive: if the user mentions a deadline, suggest setting a reminder. If they mention a meeting, offer to create a calendar event.
- When creating tasks, always try to assign a category_id if one fits. Available categories: ${categories.length > 0 ? categories.map((c) => `"${c.name}" (id: ${c.id})`).join(', ') : 'None yet — create one with create_category if appropriate.'}

## Content Policy
You are strictly a task management and productivity assistant. You must refuse any request that falls outside this scope:
- **No political content**: Do not discuss politics, political figures, elections, or political opinions.
- **No sexual or explicit content**: Do not generate sexual, romantic, or explicit material of any kind.
- **No offensive or hateful content**: Do not generate content that is racist, sexist, discriminatory, or hateful toward any group.
- **No violence**: Do not generate content that promotes or glorifies violence or self-harm.
- **No illegal activity**: Do not assist with anything illegal, including hacking, fraud, or drug-related content.
- **No personal opinions on controversial topics**: Do not take sides on religion, social issues, or other divisive subjects.
- **No impersonation**: Do not pretend to be a real person or write messages designed to deceive.

If a user asks about any of these topics, politely decline and redirect them to task management. Example: "I'm TaskPilot, your productivity assistant. I can help you manage tasks, send emails, schedule events, and more. What would you like to get done today?"`;
}

/**
 * Run the AI agent loop. Streams events via the onEvent callback.
 * Returns the final assistant text and tool calls for saving to chat history.
 */
export async function runAgent(options: AgentOptions): Promise<{
  assistantText: string;
  toolCalls: Array<{ name: string; input: Record<string, unknown>; result: string }>;
}> {
  const { userId, userClient, userMessage, onEvent, saveToHistory = true } = options;

  // Check daily budget
  const budget = checkBudget();
  if (!budget.allowed) {
    const msg = `I've reached the daily usage limit ($${budget.spent.toFixed(2)} / $${DAILY_COST_LIMIT.toFixed(2)}). The limit resets tomorrow. This is a development safeguard.`;
    onEvent({ type: 'text_delta', content: msg });
    onEvent({ type: 'done' });
    return { assistantText: msg, toolCalls: [] };
  }

  // Load user profile for system prompt
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('display_name, full_name, timezone')
    .eq('id', userId)
    .single();

  const displayName = profile?.display_name || profile?.full_name || 'User';
  const timezone = profile?.timezone || 'UTC';

  // Load user's categories for auto-categorization
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name')
    .eq('user_id', userId);

  // Build messages array (skip loading chat history for scheduler calls)
  const messages: Anthropic.MessageParam[] = [];

  if (saveToHistory) {
    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (history) {
      for (const msg of history) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }
  }

  messages.push({ role: 'user', content: userMessage });

  // Save user message to DB (skip for scheduler-initiated calls)
  if (saveToHistory) {
    await supabaseAdmin.from('chat_messages').insert({
      user_id: userId,
      role: 'user',
      content: userMessage,
    });
  }

  const systemPrompt = buildSystemPrompt(displayName, timezone, categories || []);
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

    // Track cost
    trackCost(response.usage.input_tokens, response.usage.output_tokens);

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

  // Save assistant response to DB (skip for scheduler-initiated calls)
  if (saveToHistory) {
    await supabaseAdmin.from('chat_messages').insert({
      user_id: userId,
      role: 'assistant',
      content: finalText,
      tool_calls: allToolCalls.length > 0 ? allToolCalls : null,
    });
  }

  return { assistantText: finalText, toolCalls: allToolCalls };
}
