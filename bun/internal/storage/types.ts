/** Domain VFS types and ports (colocated — no Clean Architecture package tree). */

export type NodeKind = "dir" | "file";

export interface VfsNode {
  id: string;
  parentId: string | null;
  name: string;
  kind: NodeKind;
  blobId: string | null;
  size: number;
  mime: string | null;
  updatedAt: number;
}

export interface NodeRepository {
  getById(id: string): Promise<VfsNode | null>;
  getChild(parentId: string | null, name: string): Promise<VfsNode | null>;
  listChildren(parentId: string | null): Promise<VfsNode[]>;
  insert(node: VfsNode): Promise<void>;
  update(node: VfsNode): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface BlobStore {
  readonly kind: "local" | "appwrite";
  put(opts: {
    name: string;
    bytes: Uint8Array;
    /** Appwrite folder form: trailing slash, no leading slash; "" for root */
    folder: string;
    mime?: string;
  }): Promise<{ blobId: string }>;
  get(blobId: string): Promise<Uint8Array>;
  delete(blobId: string): Promise<void>;
  /** Re-upload under a new folder (Appwrite folder is immutable). */
  move(opts: {
    blobId: string;
    name: string;
    folder: string;
    mime?: string;
  }): Promise<{ blobId: string }>;
}

/** Normalize a user path to absolute POSIX-style (`/` or `/a/b`). */
export function normalizePath(input: string): string {
  const raw = (input || "/").trim() || "/";
  const parts = raw.split("/").filter((p) => p.length > 0);
  for (const part of parts) {
    if (part === "." || part === "..") {
      throw new Error(`Invalid path segment: ${part}`);
    }
  }
  return parts.length === 0 ? "/" : `/${parts.join("/")}`;
}

export function pathSegments(path: string): string[] {
  const n = normalizePath(path);
  if (n === "/") return [];
  return n.slice(1).split("/");
}

/** Parent directory path for a file/dir path. */
export function parentPath(path: string): string {
  const segs = pathSegments(path);
  if (segs.length === 0) return "/";
  segs.pop();
  return segs.length === 0 ? "/" : `/${segs.join("/")}`;
}

export function baseName(path: string): string {
  const segs = pathSegments(path);
  return segs[segs.length - 1] ?? "";
}

/**
 * Appwrite virtual-folder form for a domain directory path.
 * `/photos/2026` → `photos/2026/` (trailing slash); `/` → `""` (bucket root).
 * @see https://appwrite.io/docs — Storage virtual folders
 */
export function toAppwriteFolder(dirPath: string): string {
  const segs = pathSegments(dirPath);
  if (segs.length === 0) return "";
  return `${segs.join("/")}/`;
}

/**
 * Canonicalize / validate an Appwrite `folder` value for createFile / Query.equal.
 * Input may omit the trailing slash; output always has it (except root `""`).
 * Rules: no leading `/`, no empty/`.`/`..` segments, max 2048 chars incl. slash.
 */
export function canonicalizeAppwriteFolder(folder: string): string {
  if (!folder || folder === "/") return "";
  let f = folder.trim();
  if (f.startsWith("/")) {
    throw new Error("Appwrite folder must not start with /");
  }
  // Strip one trailing slash for segment validation, then re-add.
  if (f.endsWith("/")) f = f.slice(0, -1);
  const parts = f.split("/");
  for (const part of parts) {
    if (!part || part === "." || part === "..") {
      throw new Error(`Invalid Appwrite folder segment: ${part || "(empty)"}`);
    }
    if (/[\x00-\x1f\x7f]/.test(part)) {
      throw new Error("Appwrite folder must not contain control characters");
    }
  }
  const canonical = `${parts.join("/")}/`;
  if (canonical.length > 2048) {
    throw new Error("Appwrite folder exceeds 2048 characters");
  }
  return canonical;
}
