import fs from 'fs';
import os from 'os';

const MAX_TEXT_LEN = 2000;

function getEventsPath() {
  if (process.env.CURSOR_EVENTS_PATH) return process.env.CURSOR_EVENTS_PATH;
  const home = os.platform() === 'win32' ? process.env.USERPROFILE : process.env.HOME;
  return `${home || os.homedir()}${os.platform() === 'win32' ? '\\' : '/'}cursor-events.jsonl`;
}

function trimText(s, max = MAX_TEXT_LEN) {
  if (typeof s !== 'string') return '';
  return s.length <= max ? s : s.slice(0, max) + '…';
}

function buildPayload(eventType, input) {
  const base = {
    event_type: eventType,
    timestamp: new Date().toISOString(),
    conversation_id: input.conversation_id ?? null,
    model: input.model ?? null,
  };
  switch (eventType) {
    case 'beforeSubmitPrompt':
      return { ...base, prompt_length: (input.prompt || '').length };
    case 'afterAgentResponse':
      return { ...base, text_length: (input.text || '').length };
    case 'afterAgentThought':
      return {
        ...base,
        duration_ms: input.duration_ms ?? 0,
        generation_id: input.generation_id ?? null,
        text_preview: trimText(input.text, 500),
      };
    case 'postToolUse':
      return {
        ...base,
        tool_name: input.tool_name ?? null,
        duration: input.duration ?? 0,
      };
    case 'postToolUseFailure':
      return {
        ...base,
        tool_name: input.tool_name ?? null,
        failure_type: input.failure_type ?? null,
      };
    case 'sessionStart':
      return {
        ...base,
        session_id: input.session_id ?? input.conversation_id ?? null,
        composer_mode: input.composer_mode ?? null,
        is_background_agent: input.is_background_agent ?? null,
      };
    case 'sessionEnd':
      return {
        ...base,
        session_id: input.session_id ?? null,
        reason: input.reason ?? null,
        duration_ms: input.duration_ms ?? 0,
        is_background_agent: input.is_background_agent ?? null,
      };
    case 'stop':
      return { ...base, status: input.status ?? null, loop_count: input.loop_count ?? 0 };
    case 'preCompact':
      return {
        ...base,
        context_tokens: input.context_tokens ?? 0,
        context_usage_percent: input.context_usage_percent ?? 0,
        message_count: input.message_count ?? 0,
      };
    case 'afterFileEdit':
      return {
        ...base,
        file_path: input.file_path ?? null,
        edits_count: Array.isArray(input.edits) ? input.edits.length : 0,
      };
    default:
      return base;
  }
}

try {
  const raw = fs.readFileSync(0, 'utf8');
  const input = JSON.parse(raw || '{}');
  const eventType = input.hook_event_name || input.event_type;
  if (!eventType) process.exit(0);

  const payload = buildPayload(eventType, input);
  const path = getEventsPath();
  fs.appendFileSync(path, JSON.stringify(payload) + '\n');
} catch {
  process.exit(0);
}
