import { NextRequest } from "next/server";
import { getStats } from "@/lib/events";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "week") as "day" | "week" | "month";

  const stats = getStats(period);
  return Response.json(stats);
}
