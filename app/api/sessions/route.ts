import { getEvents } from "@/lib/events";

export async function GET() {
  const events = getEvents();
  const sessionEnds = events.filter((e) => e.event_type === "sessionEnd");
  const sessionStarts = events.filter((e) => e.event_type === "sessionStart");

  const bySessionId = new Map<
    string,
    { session_id: string; reason?: string; duration_ms?: number; timestamp?: string; start?: string }
  >();
  for (const e of sessionStarts) {
    const id = (e as { session_id?: string }).session_id ?? e.conversation_id ?? "";
    if (id) bySessionId.set(id, { ...bySessionId.get(id), session_id: id, start: e.timestamp });
  }
  for (const e of sessionEnds) {
    const id = (e as { session_id?: string }).session_id ?? e.conversation_id ?? "";
    if (id)
      bySessionId.set(id, {
        ...bySessionId.get(id),
        session_id: id,
        reason: (e as { reason?: string }).reason,
        duration_ms: (e as { duration_ms?: number }).duration_ms,
        timestamp: e.timestamp,
      });
  }

  const sessions = Array.from(bySessionId.values())
    .filter((s) => s.timestamp)
    .sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));

  return Response.json({ sessions });
}
