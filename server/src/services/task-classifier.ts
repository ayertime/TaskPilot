/**
 * Task Classifier
 *
 * Keyword-based classification of tasks as agent-actionable vs manual.
 * This is a placeholder — will be replaced by local AI model (Llama 3.1 8B on Ollama)
 * for smarter classification.
 *
 * Returns { is_automatable, action_type } to be merged into task data.
 */

interface ClassificationResult {
  is_automatable: boolean;
  action_type: string | null;
}

// Keywords that indicate the agent can handle the task
const EMAIL_KEYWORDS = ['email', 'send email', 'reply to', 'respond to', 'write to', 'message', 'forward to', 'mail'];
const CALENDAR_KEYWORDS = ['schedule', 'meeting', 'set up a call', 'book', 'appointment', 'calendar event'];
const RESEARCH_KEYWORDS = ['research', 'look up', 'find out', 'search for', 'investigate', 'compare'];
const DOCUMENT_KEYWORDS = ['write', 'draft', 'create document', 'generate report', 'summarize', 'compose'];
const REMINDER_KEYWORDS = ['remind', 'reminder', 'don\'t forget', 'remember to'];

// Keywords that indicate a physical/manual task only the user can do
const MANUAL_KEYWORDS = [
  // Physical activities
  'gym', 'workout', 'exercise', 'run', 'jog', 'walk', 'swim', 'bike', 'hike',
  'basketball', 'football', 'soccer', 'tennis', 'golf', 'yoga', 'stretch',
  // Errands & physical tasks
  'pick up', 'drop off', 'go to', 'drive to', 'visit', 'attend', 'show up',
  'buy', 'shop', 'grocery', 'groceries', 'store', 'mall', 'pharmacy',
  'cook', 'clean', 'laundry', 'dishes', 'vacuum', 'mow', 'fix', 'repair',
  'move', 'pack', 'unpack', 'organize closet', 'take out trash',
  // Personal care
  'haircut', 'dentist', 'doctor', 'appointment with', 'checkup',
  // Social
  'lunch with', 'dinner with', 'coffee with', 'meet with', 'hang out',
  'call mom', 'call dad', 'call doctor',
  // Travel
  'flight', 'airport', 'hotel', 'check in', 'check out',
  // Generic manual
  'practice', 'study', 'read', 'review notes', 'print',
];

export function classifyTask(title: string, description?: string | null): ClassificationResult {
  const text = `${title} ${description || ''}`.toLowerCase().trim();

  // Check manual keywords first — physical tasks the user must do themselves
  if (matchesKeywords(text, MANUAL_KEYWORDS)) {
    return { is_automatable: false, action_type: null };
  }

  // Check agent-actionable keywords
  if (matchesKeywords(text, EMAIL_KEYWORDS)) {
    return { is_automatable: true, action_type: 'email' };
  }

  if (matchesKeywords(text, CALENDAR_KEYWORDS)) {
    return { is_automatable: true, action_type: 'calendar_event' };
  }

  if (matchesKeywords(text, RESEARCH_KEYWORDS)) {
    return { is_automatable: true, action_type: 'research' };
  }

  if (matchesKeywords(text, DOCUMENT_KEYWORDS)) {
    return { is_automatable: true, action_type: 'document' };
  }

  if (matchesKeywords(text, REMINDER_KEYWORDS)) {
    return { is_automatable: true, action_type: 'reminder' };
  }

  // Default: unknown — don't auto-pilot, let the user decide
  return { is_automatable: false, action_type: null };
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}
