import { collectBootPayload } from "../../../../src/web/bridge-service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const { projectDetection: _projectDetection, ...bootPayload } = await collectBootPayload();

  return Response.json(bootPayload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
