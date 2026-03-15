export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(): Promise<Response> {
  // Respond before killing so the client receives the 200
  const response = Response.json({ ok: true })

  // Defer shutdown to the next tick so the response flushes first
  setImmediate(() => {
    process.exit(0)
  })

  return response
}
