import { collectBootPayload } from "../../../../src/web/bridge-service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json(await collectBootPayload(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
