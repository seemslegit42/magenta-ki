import { apiError } from "../http/errors";
import { FsError, getFilesystem } from "../storage";
import { normalizePath } from "../storage/types";

function fsFail(err: unknown): Response {
  if (err instanceof FsError) {
    return apiError(err.status, err.code, err.message);
  }
  const message = err instanceof Error ? err.message : "Filesystem error";
  return apiError(500, "FS_ERROR", message);
}

function encodeBytes(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export const fsRoutes = {
  "/api/fs": {
    async GET(req: Request): Promise<Response> {
      try {
        const url = new URL(req.url);
        const path = normalizePath(url.searchParams.get("path") || "/");
        const children = await getFilesystem().list(path);
        return Response.json({
          path,
          entries: children.map((n) => ({
            id: n.id,
            name: n.name,
            kind: n.kind,
            size: n.size,
            mime: n.mime,
            updatedAt: n.updatedAt,
          })),
        });
      } catch (err) {
        return fsFail(err);
      }
    },

    async DELETE(req: Request): Promise<Response> {
      try {
        const url = new URL(req.url);
        const path = normalizePath(url.searchParams.get("path") || "");
        await getFilesystem().remove(path);
        return new Response(null, { status: 204 });
      } catch (err) {
        return fsFail(err);
      }
    },
  },

  "/api/fs/mkdir": {
    async POST(req: Request): Promise<Response> {
      try {
        const body = (await req.json()) as { path?: string };
        if (!body.path) {
          return apiError(400, "VALIDATION_ERROR", "path is required");
        }
        const node = await getFilesystem().mkdir(body.path);
        return Response.json(node, { status: 201 });
      } catch (err) {
        return fsFail(err);
      }
    },
  },

  "/api/fs/file": {
    async PUT(req: Request): Promise<Response> {
      try {
        const body = (await req.json()) as {
          path?: string;
          text?: string;
          contentBase64?: string;
          mime?: string;
        };
        if (!body.path) {
          return apiError(400, "VALIDATION_ERROR", "path is required");
        }
        let bytes: Uint8Array;
        if (typeof body.contentBase64 === "string") {
          bytes = new Uint8Array(Buffer.from(body.contentBase64, "base64"));
        } else if (typeof body.text === "string") {
          bytes = new TextEncoder().encode(body.text);
        } else {
          return apiError(
            400,
            "VALIDATION_ERROR",
            "text or contentBase64 is required",
          );
        }
        const node = await getFilesystem().writeFile(
          body.path,
          bytes,
          body.mime || "application/octet-stream",
        );
        return Response.json(node);
      } catch (err) {
        return fsFail(err);
      }
    },

    async GET(req: Request): Promise<Response> {
      try {
        const url = new URL(req.url);
        const path = normalizePath(url.searchParams.get("path") || "");
        const { node, bytes } = await getFilesystem().readFile(path);
        const asText = url.searchParams.get("encoding") === "text";
        return Response.json({
          path,
          node,
          ...(asText
            ? { text: new TextDecoder().decode(bytes) }
            : { contentBase64: encodeBytes(bytes) }),
        });
      } catch (err) {
        return fsFail(err);
      }
    },
  },

  "/api/fs/move": {
    async POST(req: Request): Promise<Response> {
      try {
        const body = (await req.json()) as { from?: string; to?: string };
        if (!body.from || !body.to) {
          return apiError(400, "VALIDATION_ERROR", "from and to are required");
        }
        const node = await getFilesystem().move(body.from, body.to);
        return Response.json(node);
      } catch (err) {
        return fsFail(err);
      }
    },
  },
} as const;
