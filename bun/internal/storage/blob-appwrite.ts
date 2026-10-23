/**
 * Appwrite Storage blob adapter — official virtual `folder` attribute.
 * Directory index remains in Turso; this only stores bytes.
 *
 * Folder semantics (Appwrite docs):
 * - Pass `folder` on createFile (e.g. `photos/2026`); stored as `photos/2026/`.
 * - Root is `""`. Folder is immutable after upload → move = create + delete.
 * - Query.equal('folder', ['photos/2026/']) lists files in a folder (trailing slash required).
 */
import { Client, Storage, ID, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { config } from "../config";
import { canonicalizeAppwriteFolder, type BlobStore } from "./types";

function createSdk(): { storage: Storage; bucketId: string } {
  const client = new Client()
    .setEndpoint(config.appwriteEndpoint)
    .setProject(config.appwriteProjectId)
    .setKey(config.appwriteApiKey);
  return { storage: new Storage(client), bucketId: config.appwriteBucketId };
}

export function createAppwriteBlobStore(): BlobStore & {
  listFilesInFolder: (
    folder: string,
    mode?: "exact" | "prefix",
  ) => Promise<{ $id: string; name: string; folder: string; key?: string }[]>;
  listFolders: () => Promise<string[]>;
} {
  const { storage, bucketId } = createSdk();

  const store = {
    kind: "appwrite" as const,

    async put({ name, bytes, folder, mime }: {
      name: string;
      bytes: Uint8Array;
      folder: string;
      mime?: string;
    }) {
      const fileId = ID.unique();
      const input = InputFile.fromBuffer(
        Buffer.from(bytes),
        name,
        mime || "application/octet-stream",
      );
      // Root = ""; otherwise canonical trailing-slash form (SDK also accepts without).
      const folderParam = canonicalizeAppwriteFolder(folder);
      await storage.createFile({
        bucketId,
        fileId,
        file: input,
        folder: folderParam,
      });
      return { blobId: fileId };
    },

    async get(blobId: string) {
      const buf = await storage.getFileDownload({ bucketId, fileId: blobId });
      if (buf instanceof ArrayBuffer) {
        return new Uint8Array(buf);
      }
      if (buf instanceof Uint8Array) {
        return buf;
      }
      return new Uint8Array(buf as ArrayBuffer);
    },

    async delete(blobId: string) {
      await storage.deleteFile({ bucketId, fileId: blobId });
    },

    async move({
      blobId,
      name,
      folder,
      mime,
    }: {
      blobId: string;
      name: string;
      folder: string;
      mime?: string;
    }) {
      // Folder immutable on Appwrite → re-upload then delete original.
      const bytes = await store.get(blobId);
      const created = await store.put({ name, bytes, folder, mime });
      await store.delete(blobId);
      return created;
    },

    /** Exact folder match or prefix (startsWith) per Appwrite folder queries. */
    async listFilesInFolder(folder: string, mode: "exact" | "prefix" = "exact") {
      const canonical = canonicalizeAppwriteFolder(folder);
      const queries =
        mode === "prefix"
          ? [
              Query.startsWith(
                "folder",
                canonical === "" ? "" : canonical,
              ),
            ]
          : [Query.equal("folder", [canonical])];

      const result = await storage.listFiles({ bucketId, queries });
      return result.files.map((f) => ({
        $id: f.$id,
        name: f.name,
        folder: (f as { folder?: string }).folder ?? "",
        key: (f as { key?: string }).key,
      }));
    },

    /** Aggregate unique folder paths (+ parents) by paging the bucket. */
    async listFolders() {
      const limit = 100;
      let cursor = "";
      const folders = new Set<string>();

      for (;;) {
        const queries = [
          Query.limit(limit),
          ...(cursor ? [Query.cursorAfter(cursor)] : []),
        ];
        const page = await storage.listFiles({ bucketId, queries });
        for (const file of page.files) {
          const folder = (file as { folder?: string }).folder ?? "";
          let path = "";
          for (const part of folder.split("/").filter(Boolean)) {
            path += `${part}/`;
            folders.add(path);
          }
        }
        if (page.files.length < limit) break;
        cursor = page.files[page.files.length - 1]!.$id;
      }

      return [...folders].sort();
    },
  };

  return store;
}
