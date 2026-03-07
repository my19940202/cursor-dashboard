import { NextRequest } from "next/server";
import { getThinking } from "@/lib/thinking";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const model = searchParams.get("model") ?? undefined;

  const result = getThinking({ page, pageSize, from, to, model });
  return Response.json(result);
}
