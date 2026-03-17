import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/browse-directories?path=/some/path
 *
 * Returns the directory listing for the given path.
 * Defaults to the user's home directory if no path is provided.
 * Only returns directories (no files) for the folder picker use case.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const rawPath = url.searchParams.get("path");
    const targetPath = rawPath ? resolve(rawPath) : homedir();

    if (!existsSync(targetPath)) {
      return Response.json(
        { error: `Path does not exist: ${targetPath}` },
        { status: 404 },
      );
    }

    const stat = statSync(targetPath);
    if (!stat.isDirectory()) {
      return Response.json(
        { error: `Not a directory: ${targetPath}` },
        { status: 400 },
      );
    }

    const parentPath = dirname(targetPath);
    const entries: Array<{ name: string; path: string }> = [];

    try {
      const items = readdirSync(targetPath, { withFileTypes: true });
      for (const item of items) {
        // Only directories, skip dotfiles and common non-project dirs
        if (!item.isDirectory()) continue;
        if (item.name.startsWith(".")) continue;
        if (item.name === "node_modules") continue;

        entries.push({
          name: item.name,
          path: resolve(targetPath, item.name),
        });
      }
    } catch {
      // Permission denied or other read error — return empty entries
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({
      current: targetPath,
      parent: parentPath !== targetPath ? parentPath : null,
      entries,
    });
  } catch (err) {
    return Response.json(
      { error: `Browse failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
