import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config";
import type { BlobStore } from "./types";

function rootDir(): string {
  mkdirSync(config.localBlobRoot, { recursive: true });
  return config.localBlobRoot;
}

export function createLocalBlobStore(): BlobStore {
  return {
    kind: "local",

    async put({ bytes }) {
      const blobId = crypto.randomUUID();
      const path = join(rootDir(), blobId);
      writeFileSync(path, bytes);
      return { blobId };
    },

    async get(blobId) {
      const path = join(rootDir(), blobId);
      if (!existsSync(path)) {
        throw new Error(`Blob not found: ${blobId}`);
      }
      return new Uint8Array(readFileSync(path));
    },

    async delete(blobId) {
      const path = join(rootDir(), blobId);
      if (existsSync(path)) {
        rmSync(path);
      }
    },

    async move({ blobId, name, folder, mime }) {
      const bytes = await this.get(blobId);
      await this.delete(blobId);
      return this.put({ name, bytes, folder, mime });
    },
  };
}
