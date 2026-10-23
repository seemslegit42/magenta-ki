import { config } from "../config";
import { createAppwriteBlobStore } from "./blob-appwrite";
import { createLocalBlobStore } from "./blob-local";
import { FilesystemService } from "./filesystem";
import { createTursoNodeRepository } from "./nodes-turso";
import type { BlobStore } from "./types";

let fsSingleton: FilesystemService | null = null;

function createBlobStore(): BlobStore {
  if (config.useAppwriteBlobs) {
    return createAppwriteBlobStore();
  }
  return createLocalBlobStore();
}

export function getFilesystem(): FilesystemService {
  if (!fsSingleton) {
    fsSingleton = new FilesystemService(
      createTursoNodeRepository(),
      createBlobStore(),
    );
  }
  return fsSingleton;
}

export { FilesystemService, FsError } from "./filesystem";
export type { VfsNode, BlobStore, NodeRepository } from "./types";
