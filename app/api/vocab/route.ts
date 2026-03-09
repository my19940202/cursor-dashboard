import { NextRequest } from "next/server";
import { getVocabStats } from "@/lib/vocab";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const model = searchParams.get("model") ?? undefined;
  const wordLimit = parseInt(searchParams.get("wordLimit") ?? "200", 10);
  const phraseLimit = parseInt(searchParams.get("phraseLimit") ?? "200", 10);

  const data = getVocabStats({ from, to, model, wordLimit, phraseLimit });
  return Response.json(data);
}
