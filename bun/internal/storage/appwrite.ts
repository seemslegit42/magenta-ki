/**
 * Appwrite Storage adapter for the Bun control plane.
 * Moved from the Angular host — keep I/O at the API boundary.
 */
import { Client, Storage, ID, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const storage = new Storage(client);
const BUCKET_ID = process.env.APPWRITE_BUCKET_ID!;

export const fileStorage = {
  async listFiles() {
    return await storage.listFiles(BUCKET_ID, [Query.orderDesc("$createdAt")]);
  },

  async upload(base64Data: string, fileName: string) {
    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");
    const inputFile = InputFile.fromBuffer(buffer, fileName);
    return await storage.createFile(BUCKET_ID, ID.unique(), inputFile);
  },

  async delete(fileId: string) {
    return await storage.deleteFile(BUCKET_ID, fileId);
  },

  async getDownload(fileId: string) {
    return await storage.getFileDownload(BUCKET_ID, fileId);
  },
};
