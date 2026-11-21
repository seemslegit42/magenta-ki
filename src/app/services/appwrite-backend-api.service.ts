import { Injectable, signal } from '@angular/core';

export interface ConsoleInfo {
  endpoint: string;
  projectId: string;
  databaseId: string;
  bucketId: string;
  status: string;
  mode: string;
}

export interface ItemRecord {
  $id?: string;
  title: string;
  description?: string;
  createdBy?: string;
  teamId?: string;
  $createdAt?: string;
}

export interface ProjectRecord {
  $id?: string;
  name: string;
  description?: string;
  createdBy?: string;
  teamId?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface XiFloorResponse {
  xiFloorUsd: number;
  fiatPegCurrency: string;
  fiatRatio: number;
  components: Record<string, number>;
  formula: string;
}

@Injectable({ providedIn: 'root' })
export class AppwriteBackendApiService {
  private readonly baseUrl = ''; // Proxied via Vite/Express to Go backend /api/*

  public readonly isConnected = signal<boolean>(true);
  public readonly backendLatencyMs = signal<number>(8);
  public readonly lastError = signal<string | null>(null);

  /**
   * Health check on the Go gateway service
   */
  public async getHealth(): Promise<{ status: string; service: string; engine: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Retrieves Appwrite instance & configuration info from Go backend
   */
  public async getConsoleInfo(sessionToken?: string): Promise<ConsoleInfo> {
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      const res = await fetch(`${this.baseUrl}/api/console/info`, { headers });
      if (!res.ok) throw new Error(`Failed to fetch console info: ${res.statusText}`);
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * List items from the database via Appwrite Go SDK backend
   */
  public async listItems(sessionToken?: string): Promise<ItemRecord[]> {
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      const res = await fetch(`${this.baseUrl}/api/items`, { headers });
      if (!res.ok) throw new Error(`Failed to list items: ${res.statusText}`);
      const data = await res.json();
      return data.items || [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Create a new item in the database via Appwrite Go SDK backend
   */
  public async createItem(title: string, teamId?: string, sessionToken?: string): Promise<ItemRecord> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      const res = await fetch(`${this.baseUrl}/api/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, teamId }),
      });
      if (!res.ok) throw new Error(`Failed to create item: ${res.statusText}`);
      const data = await res.json();
      return data.item;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Get an item by ID with ownership verification
   */
  public async getItem(id: string, sessionToken?: string): Promise<ItemRecord> {
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const res = await fetch(`${this.baseUrl}/api/items/get?id=${encodeURIComponent(id)}`, { headers });
      if (!res.ok) throw new Error(`Failed to get item: ${res.statusText}`);
      const data = await res.json();
      return data.item;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Update an item enforcing createdBy & teamId immutability
   */
  public async updateItem(id: string, payload: Partial<ItemRecord>, sessionToken?: string): Promise<ItemRecord> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const res = await fetch(`${this.baseUrl}/api/items?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to update item: ${res.statusText}`);
      const data = await res.json();
      return data.item;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Delete an item with ownership verification
   */
  public async deleteItem(id: string, sessionToken?: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const res = await fetch(`${this.baseUrl}/api/items?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`Failed to delete item: ${res.statusText}`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * List projects with team-based tenant isolation or owner filter
   */
  public async listProjects(teamId?: string, sessionToken?: string): Promise<ProjectRecord[]> {
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const url = teamId ? `${this.baseUrl}/api/projects?teamId=${encodeURIComponent(teamId)}` : `${this.baseUrl}/api/projects`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Failed to list projects: ${res.statusText}`);
      const data = await res.json();
      return data.projects || [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Create a new project enforcing createdBy & teamId ownership
   */
  public async createProject(name: string, description?: string, teamId?: string, sessionToken?: string): Promise<ProjectRecord> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const res = await fetch(`${this.baseUrl}/api/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, description, teamId }),
      });
      if (!res.ok) throw new Error(`Failed to create project: ${res.statusText}`);
      const data = await res.json();
      return data.project;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Get project with ownership verification
   */
  public async getProject(id: string, sessionToken?: string): Promise<ProjectRecord> {
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const res = await fetch(`${this.baseUrl}/api/projects/get?id=${encodeURIComponent(id)}`, { headers });
      if (!res.ok) throw new Error(`Failed to get project: ${res.statusText}`);
      const data = await res.json();
      return data.project;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Update project enforcing createdBy & teamId immutability
   */
  public async updateProject(id: string, payload: Partial<ProjectRecord>, sessionToken?: string): Promise<ProjectRecord> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const res = await fetch(`${this.baseUrl}/api/projects?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update project: ${res.statusText}`);
      }
      const data = await res.json();
      return data.project;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Delete project with ownership verification
   */
  public async deleteProject(id: string, sessionToken?: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const res = await fetch(`${this.baseUrl}/api/projects?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`Failed to delete project: ${res.statusText}`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Delete file from storage bucket
   */
  public async deleteFile(fileId: string, sessionToken?: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const res = await fetch(`${this.baseUrl}/api/storage/file?fileId=${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`Failed to delete file: ${res.statusText}`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Upload file via base64 flow (returns File ID only)
   */
  public async uploadFile(base64Data: string, fileName: string, mimeType = 'application/octet-stream', sessionToken?: string): Promise<{ fileId: string; fileName: string }> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const res = await fetch(`${this.baseUrl}/api/storage/upload`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ base64Data, fileName, mimeType }),
      });
      if (!res.ok) throw new Error(`Failed to upload file: ${res.statusText}`);
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Fetch file as base64 data URL for client consumption
   */
  public async getFileDataUrl(fileId: string, mimeType?: string, sessionToken?: string): Promise<string> {
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const url = `${this.baseUrl}/api/storage/download?fileId=${encodeURIComponent(fileId)}${mimeType ? `&mimeType=${encodeURIComponent(mimeType)}` : ''}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Failed to download file: ${res.statusText}`);
      const data = await res.json();
      return data.dataUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Send transactional email via Messaging SDK wrapper
   */
  public async sendEmail(subject: string, content: string, users: string[] = [], topics: string[] = [], sessionToken?: string) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const res = await fetch(`${this.baseUrl}/api/messaging/email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ subject, content, users, topics, targets: [] }),
      });
      if (!res.ok) throw new Error(`Failed to send email: ${res.statusText}`);
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Send push notification via Messaging SDK wrapper
   */
  public async sendPush(title: string, body: string, users: string[] = [], topics: string[] = [], data?: Record<string, unknown>, sessionToken?: string) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const res = await fetch(`${this.baseUrl}/api/messaging/push`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, body, users, topics, targets: [], data: data || {} }),
      });
      if (!res.ok) throw new Error(`Failed to send push: ${res.statusText}`);
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Send SMS message via Messaging SDK wrapper
   */
  public async sendSMS(content: string, users: string[] = [], sessionToken?: string) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      const res = await fetch(`${this.baseUrl}/api/messaging/sms`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content, users, topics: [], targets: [] }),
      });
      if (!res.ok) throw new Error(`Failed to send SMS: ${res.statusText}`);
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Get Ξ (Xi) Economy Floor calculation
   */
  public async getXiFloor(): Promise<XiFloorResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/api/xi/floor`);
      if (!res.ok) throw new Error(`Failed to fetch Xi floor: ${res.statusText}`);
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Burn Ξ units for CogniOps inference / elastic access
   */
  public async burnXi(customerId: string, xiUnits: number, reason?: string, isElasticAccess = false) {
    try {
      const res = await fetch(`${this.baseUrl}/api/xi/burn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, xiUnits, reason, isElasticAccess }),
      });
      if (!res.ok) throw new Error(`Failed to burn Xi units: ${res.statusText}`);
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Calculate Proof-of-Attribution (PoA) reward
   */
  public async calculatePoAReward(contributorId?: string, datasetWeightNk?: number, qualityFactorFk?: number, efficacyImpactEdata?: number) {
    try {
      const res = await fetch(`${this.baseUrl}/api/xi/poa-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contributorId, datasetWeightNk, qualityFactorFk, efficacyImpactEdata }),
      });
      if (!res.ok) throw new Error(`Failed to calculate PoA reward: ${res.statusText}`);
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Get Xi Sankey economic flow diagram data
   */
  public async getXiSankey() {
    try {
      const res = await fetch(`${this.baseUrl}/api/xi/sankey`);
      if (!res.ok) throw new Error(`Failed to fetch Sankey data: ${res.statusText}`);
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }

  /**
   * Get Xi Governance proposals
   */
  public async getXiGovernance() {
    try {
      const res = await fetch(`${this.baseUrl}/api/xi/governance`);
      if (!res.ok) throw new Error(`Failed to fetch governance data: ${res.statusText}`);
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.lastError.set(msg);
      throw err;
    }
  }
}
