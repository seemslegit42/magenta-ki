import { beforeEach, describe, expect, it } from 'bun:test';

interface Project {
  $id: string;
  name: string;
  description?: string;
  createdBy: string;
  teamId?: string;
  $createdAt: string;
  $updatedAt: string;
}

// Emulate ProjectRepository ownership enforcement and immutability rules
class MockProjectRepository {
  private projects: Project[] = [
    {
      $id: 'proj_alpha',
      name: 'Verdigris Mesh Orchestration Hub',
      description: 'Distributed micro-kernel service mesh',
      createdBy: 'usr_operator_7842',
      teamId: 'team_enterprise_alpha',
      $createdAt: '2026-11-10T10:00:00Z',
      $updatedAt: '2026-11-10T10:00:00Z',
    },
    {
      $id: 'proj_beta',
      name: 'Hybrid File Storage Pipeline',
      description: 'Centralized bucket storage wrapper',
      createdBy: 'usr_operator_7842',
      teamId: 'team_devops',
      $createdAt: '2026-11-10T11:00:00Z',
      $updatedAt: '2026-11-10T11:00:00Z',
    },
    {
      $id: 'proj_gamma_personal',
      name: 'Personal Sandbox Environment',
      description: 'Isolated test bench',
      createdBy: 'usr_developer_99',
      $createdAt: '2026-11-10T12:00:00Z',
      $updatedAt: '2026-11-10T12:00:00Z',
    },
  ];

  listByTeam(teamId: string, userTeams?: string[]): Project[] {
    if (!teamId.trim()) {
      throw new Error('appwrite: teamID cannot be empty for ListByTeam');
    }
    if (userTeams && !userTeams.includes(teamId) && !userTeams.includes('administrator')) {
      throw new Error(`appwrite: forbidden - user is not a member of team ${teamId}`);
    }
    return this.projects.filter((p) => p.teamId === teamId);
  }

  listByOwner(userId: string): Project[] {
    if (!userId.trim()) {
      throw new Error('appwrite: userID cannot be empty for ListByOwner');
    }
    return this.projects.filter((p) => p.createdBy === userId);
  }

  getWithOwnership(projectId: string, userId: string, userTeams: string[]): Project {
    const project = this.projects.find((p) => p.$id === projectId);
    if (!project) {
      throw new Error(`appwrite: project ${projectId} not found`);
    }

    const isOwner = project.createdBy === userId;
    const isTeamMember = project.teamId
      ? userTeams.includes(project.teamId) || userTeams.includes('administrator')
      : false;

    if (!isOwner && !isTeamMember) {
      throw new Error(
        `appwrite: forbidden - user ${userId} is not authorized to access project ${projectId}`,
      );
    }
    return project;
  }

  create(name: string, userId: string, teamId?: string, description?: string): Project {
    if (!name.trim()) {
      throw new Error('appwrite: project name is required');
    }
    if (!userId.trim()) {
      throw new Error('appwrite: project createdBy is required for ownership enforcement');
    }

    const project: Project = {
      $id: `proj_${Date.now()}`,
      name: name.trim(),
      description,
      createdBy: userId,
      teamId,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
    };
    this.projects.push(project);
    return project;
  }

  update(projectId: string, userId: string, updates: Record<string, unknown>, userTeams: string[]): Project {
    const existing = this.getWithOwnership(projectId, userId, userTeams);

    // Enforce immutability of createdBy
    if ('createdBy' in updates && updates['createdBy'] !== existing.createdBy) {
      throw new Error(
        `appwrite: validation error - createdBy is immutable and cannot be updated from ${existing.createdBy} to ${updates['createdBy']}`,
      );
    }

    // Enforce immutability of teamId
    if ('teamId' in updates && updates['teamId'] !== existing.teamId) {
      throw new Error(
        `appwrite: validation error - teamId is immutable and cannot be updated from ${existing.teamId} to ${updates['teamId']}`,
      );
    }

    // Strip immutable fields from application
    const cleanUpdates = { ...updates };
    delete cleanUpdates['createdBy'];
    delete cleanUpdates['teamId'];
    delete cleanUpdates['$id'];
    delete cleanUpdates['$createdAt'];
    delete cleanUpdates['$updatedAt'];

    if (typeof cleanUpdates['name'] === 'string') {
      existing.name = cleanUpdates['name'].trim();
    }
    if (typeof cleanUpdates['description'] === 'string') {
      existing.description = cleanUpdates['description'];
    }
    existing.$updatedAt = new Date().toISOString();

    return existing;
  }
}

describe('Projects Repository Ownership Enforcement & Immutability', () => {
  let repo: MockProjectRepository;

  beforeEach(() => {
    repo = new MockProjectRepository();
  });

  it('lists projects by team strictly for authorized team members', () => {
    const alphaProjects = repo.listByTeam('team_enterprise_alpha', ['team_enterprise_alpha']);
    expect(alphaProjects.length).toBe(1);
    expect(alphaProjects[0].$id).toBe('proj_alpha');
    expect(alphaProjects[0].teamId).toBe('team_enterprise_alpha');

    const devopsProjects = repo.listByTeam('team_devops', ['team_devops']);
    expect(devopsProjects.length).toBe(1);
    expect(devopsProjects[0].$id).toBe('proj_beta');

    expect(() => repo.listByTeam('team_devops', ['team_enterprise_alpha'])).toThrow(
      'appwrite: forbidden - user is not a member of team team_devops',
    );
  });

  it('lists projects by owner correctly', () => {
    const ownerProjects = repo.listByOwner('usr_operator_7842');
    expect(ownerProjects.length).toBe(2);
    expect(ownerProjects.every((p) => p.createdBy === 'usr_operator_7842')).toBe(true);

    const devProjects = repo.listByOwner('usr_developer_99');
    expect(devProjects.length).toBe(1);
    expect(devProjects[0].$id).toBe('proj_gamma_personal');
  });

  it('enforces ownership or team membership on retrieval', () => {
    const proj = repo.getWithOwnership('proj_alpha', 'usr_operator_7842', ['team_enterprise_alpha']);
    expect(proj.name).toBe('Verdigris Mesh Orchestration Hub');

    // Another user in the same team can access team project
    const teamAccess = repo.getWithOwnership('proj_alpha', 'usr_coworker', ['team_enterprise_alpha']);
    expect(teamAccess.$id).toBe('proj_alpha');

    // Unauthorized user cannot access personal project of another user
    expect(() => repo.getWithOwnership('proj_gamma_personal', 'usr_unauthorized', ['team_other'])).toThrow(
      'forbidden',
    );
  });

  it('strictly rejects modifications to createdBy during update', () => {
    expect(() => {
      repo.update(
        'proj_alpha',
        'usr_operator_7842',
        {
          name: 'Renamed Project',
          createdBy: 'hacker_user_007',
        },
        ['team_enterprise_alpha'],
      );
    }).toThrow('createdBy is immutable');
  });

  it('strictly rejects modifications to teamId during update', () => {
    expect(() => {
      repo.update(
        'proj_alpha',
        'usr_operator_7842',
        {
          name: 'Renamed Project',
          teamId: 'team_hijacked_id',
        },
        ['team_enterprise_alpha'],
      );
    }).toThrow('teamId is immutable');
  });

  it('allows updating mutable fields like name and description while preserving createdBy and teamId', () => {
    const updated = repo.update(
      'proj_alpha',
      'usr_operator_7842',
      {
        name: 'Updated Mesh Orchestration Platform',
        description: 'Enhanced cluster controller architecture',
      },
      ['team_enterprise_alpha'],
    );

    expect(updated.name).toBe('Updated Mesh Orchestration Platform');
    expect(updated.description).toBe('Enhanced cluster controller architecture');
    expect(updated.createdBy).toBe('usr_operator_7842');
    expect(updated.teamId).toBe('team_enterprise_alpha');
  });
});
