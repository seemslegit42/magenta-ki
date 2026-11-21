import { Injectable, signal } from '@angular/core';
import { ProjectRecord } from './appwrite-backend-api.service';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly baseUrl = '';

  public readonly projects = signal<ProjectRecord[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly lastError = signal<string | null>(null);
  public readonly activeTeamFilter = signal<string>('');

  constructor() {
    this.fetchProjects();
  }

  public async fetchProjects(teamId?: string): Promise<ProjectRecord[]> {
    this.isLoading.set(true);
    this.lastError.set(null);
    try {
      const targetTeam = teamId !== undefined ? teamId : this.activeTeamFilter();
      const url = targetTeam ? `${this.baseUrl}/api/projects?teamId=${encodeURIComponent(targetTeam)}` : `${this.baseUrl}/api/projects`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch projects: ${res.statusText}`);
      }
      const data = await res.json();
      const list = data.projects || [];
      this.projects.set(list);
      return list;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error fetching projects';
      this.lastError.set(msg);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  public async createProject(payload: { name: string; description?: string; teamId?: string }): Promise<ProjectRecord> {
    this.isLoading.set(true);
    this.lastError.set(null);
    try {
      const res = await fetch(`${this.baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to create project: ${res.statusText}`);
      }

      const data = await res.json();
      const newProj = data.project;
      
      // Update local signal state optimistically or refresh
      this.projects.update(list => [newProj, ...list]);
      return newProj;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error creating project';
      this.lastError.set(msg);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  public async updateProject(id: string, payload: Partial<ProjectRecord>): Promise<ProjectRecord> {
    this.isLoading.set(true);
    this.lastError.set(null);
    try {
      const res = await fetch(`${this.baseUrl}/api/projects?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to update project: ${res.statusText}`);
      }

      const data = await res.json();
      const updated = data.project;

      this.projects.update(list => list.map(p => p.$id === id ? updated : p));
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error updating project';
      this.lastError.set(msg);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  public async deleteProject(id: string): Promise<boolean> {
    this.isLoading.set(true);
    this.lastError.set(null);
    try {
      const res = await fetch(`${this.baseUrl}/api/projects?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`Failed to delete project: ${res.statusText}`);
      }

      this.projects.update(list => list.filter(p => p.$id !== id));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error deleting project';
      this.lastError.set(msg);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  public async setTeamFilter(teamId: string): Promise<void> {
    this.activeTeamFilter.set(teamId);
    await this.fetchProjects(teamId);
  }
}
