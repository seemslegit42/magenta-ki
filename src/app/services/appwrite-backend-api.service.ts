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

export interface XiFloorResponse {
  xiFloorUsd: number;
  fiatPegCurrency: string;
  fiatRatio: number;
  components: Record<string, number>;
  formula: string;
}

@Injectable({ providedIn: 'root' })
export class AppwriteBackendApiService {
  private readonly baseUrl = ''; // Proxied via Caddy to Go backend /api/*

  public readonly isConnected = signal<boolean>(true);
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
