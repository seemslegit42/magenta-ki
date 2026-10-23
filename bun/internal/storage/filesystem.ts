import {
  baseName,
  normalizePath,
  parentPath,
  pathSegments,
  toAppwriteFolder,
  type BlobStore,
  type NodeRepository,
  type VfsNode,
} from "./types";

export class FilesystemService {
  constructor(
    private readonly nodes: NodeRepository,
    private readonly blobs: BlobStore,
  ) {}

  async resolve(path: string): Promise<VfsNode | null> {
    const segs = pathSegments(path);
    if (segs.length === 0) {
      return this.nodes.getById("root");
    }
    let parentId: string | null = "root";
    let node: VfsNode | null = null;
    for (const seg of segs) {
      node = await this.nodes.getChild(parentId, seg);
      if (!node) return null;
      parentId = node.id;
    }
    return node;
  }

  async list(path: string): Promise<VfsNode[]> {
    const dir = await this.resolve(path);
    if (!dir) throw new FsError(404, "NOT_FOUND", `Path not found: ${path}`);
    if (dir.kind !== "dir") {
      throw new FsError(400, "NOT_A_DIRECTORY", `Not a directory: ${path}`);
    }
    return this.nodes.listChildren(dir.id);
  }

  async mkdir(path: string): Promise<VfsNode> {
    const n = normalizePath(path);
    if (n === "/") {
      throw new FsError(400, "INVALID_PATH", "Cannot create root");
    }
    const existing = await this.resolve(n);
    if (existing) {
      if (existing.kind === "dir") return existing;
      throw new FsError(409, "EXISTS", `File exists at ${n}`);
    }
    const parent = await this.ensureDir(parentPath(n));
    const node: VfsNode = {
      id: crypto.randomUUID(),
      parentId: parent.id,
      name: baseName(n),
      kind: "dir",
      blobId: null,
      size: 0,
      mime: null,
      updatedAt: Date.now(),
    };
    await this.nodes.insert(node);
    return node;
  }

  async writeFile(
    path: string,
    content: Uint8Array | string,
    mime = "application/octet-stream",
  ): Promise<VfsNode> {
    const n = normalizePath(path);
    if (n === "/") {
      throw new FsError(400, "INVALID_PATH", "Cannot write root as file");
    }
    const bytes =
      typeof content === "string" ? new TextEncoder().encode(content) : content;
    const parent = await this.ensureDir(parentPath(n));
    const name = baseName(n);
    const folder = toAppwriteFolder(parentPath(n));
    const existing = await this.nodes.getChild(parent.id, name);

    if (existing?.kind === "dir") {
      throw new FsError(409, "IS_DIRECTORY", `Directory exists at ${n}`);
    }

    if (existing?.kind === "file" && existing.blobId) {
      await this.blobs.delete(existing.blobId);
    }

    const { blobId } = await this.blobs.put({ name, bytes, folder, mime });
    const now = Date.now();

    if (existing) {
      const updated: VfsNode = {
        ...existing,
        blobId,
        size: bytes.byteLength,
        mime,
        updatedAt: now,
      };
      await this.nodes.update(updated);
      return updated;
    }

    const node: VfsNode = {
      id: crypto.randomUUID(),
      parentId: parent.id,
      name,
      kind: "file",
      blobId,
      size: bytes.byteLength,
      mime,
      updatedAt: now,
    };
    await this.nodes.insert(node);
    return node;
  }

  async readFile(path: string): Promise<{ node: VfsNode; bytes: Uint8Array }> {
    const node = await this.resolve(path);
    if (!node) throw new FsError(404, "NOT_FOUND", `Path not found: ${path}`);
    if (node.kind !== "file" || !node.blobId) {
      throw new FsError(400, "NOT_A_FILE", `Not a file: ${path}`);
    }
    const bytes = await this.blobs.get(node.blobId);
    return { node, bytes };
  }

  async remove(path: string): Promise<void> {
    const n = normalizePath(path);
    if (n === "/") {
      throw new FsError(400, "INVALID_PATH", "Cannot delete root");
    }
    const node = await this.resolve(n);
    if (!node) throw new FsError(404, "NOT_FOUND", `Path not found: ${n}`);

    if (node.kind === "dir") {
      const kids = await this.nodes.listChildren(node.id);
      if (kids.length > 0) {
        throw new FsError(409, "NOT_EMPTY", `Directory not empty: ${n}`);
      }
    } else if (node.blobId) {
      await this.blobs.delete(node.blobId);
    }
    await this.nodes.remove(node.id);
  }

  async move(from: string, to: string): Promise<VfsNode> {
    const srcPath = normalizePath(from);
    const dstPath = normalizePath(to);
    const src = await this.resolve(srcPath);
    if (!src) throw new FsError(404, "NOT_FOUND", `Path not found: ${srcPath}`);

    const dstParent = await this.ensureDir(parentPath(dstPath));
    const dstName = baseName(dstPath);
    const conflict = await this.nodes.getChild(dstParent.id, dstName);
    if (conflict) {
      throw new FsError(409, "EXISTS", `Target exists: ${dstPath}`);
    }

    let blobId = src.blobId;
    if (src.kind === "file" && src.blobId) {
      const folder = toAppwriteFolder(parentPath(dstPath));
      const moved = await this.blobs.move({
        blobId: src.blobId,
        name: dstName,
        folder,
        mime: src.mime ?? undefined,
      });
      blobId = moved.blobId;
    }

    const updated: VfsNode = {
      ...src,
      parentId: dstParent.id,
      name: dstName,
      blobId,
      updatedAt: Date.now(),
    };
    await this.nodes.update(updated);
    return updated;
  }

  private async ensureDir(path: string): Promise<VfsNode> {
    const n = normalizePath(path);
    if (n === "/") {
      const root = await this.nodes.getById("root");
      if (!root) throw new FsError(500, "NO_ROOT", "VFS root missing");
      return root;
    }
    const existing = await this.resolve(n);
    if (existing) {
      if (existing.kind !== "dir") {
        throw new FsError(400, "NOT_A_DIRECTORY", `Not a directory: ${n}`);
      }
      return existing;
    }
    return this.mkdir(n);
  }
}

export class FsError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "FsError";
  }
}
