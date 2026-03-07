import { NextRequest } from "next/server";
import { getEvents, aggregateByDay } from "@/lib/events";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const event_type = searchParams.get("event_type") ?? undefined;

  const events = getEvents(from, to, event_type);
  const byDay = aggregateByDay(events);

  return Response.json({ events, byDay });
}
