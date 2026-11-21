export type PipelineStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled';

export type PipelineStepName =
  | 'quality_biome'
  | 'typecheck'
  | 'test_unit'
  | 'test_integration'
  | 'test_e2e'
  | 'test_go'
  | 'build_webos'
  | 'build_go'
  | 'docker_build'
  | 'deploy_staging';

export interface PipelineStep {
  name: PipelineStepName;
  label: string;
  status: PipelineStatus;
  durationMs: number;
  logs: string[];
  command: string;
}

export interface PipelineRun {
  id: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  branch: string;
  triggerEvent: 'gitlab_push' | 'merge_request' | 'manual' | 'schedule';
  status: PipelineStatus;
  startedAt: number;
  completedAt?: number;
  durationMs: number;
  steps: PipelineStep[];
  stagingDeployedUrl?: string;
}

export interface StagingTargetStatus {
  targetName: string;
  url: string;
  environment: 'staging' | 'preview' | 'production';
  status: 'online' | 'deploying' | 'degraded' | 'offline';
  activeVersion: string;
  activeCommitSha: string;
  lastDeployedAt: number;
  healthCheckStatus: 'passing' | 'warning' | 'failing';
  latencyMs: number;
  containerId: string;
  memoryUsageMb: number;
  cpuPercent: number;
  replicas: number;
}

export type UatBusinessArea =
  | 'Project Collaboration'
  | 'Document Workspace'
  | 'Billing & Usage'
  | 'Security & Access';

export type UatScenarioStatus = 'pending' | 'approved' | 'changes_requested' | 'blocked';

export interface UatScenario {
  id: string;
  businessArea: UatBusinessArea;
  title: string;
  plainLanguageGoal: string;
  stepsToVerify: string[];
  expectedOutcome: string;
  status: UatScenarioStatus;
  reviewerName: string;
  reviewerNote: string;
  updatedAt: number;
}

export type UatSignOffDecision = 'pending' | 'approved' | 'rejected';

export interface UatSignOffRecord {
  releaseLabel: string;
  decision: UatSignOffDecision;
  signedBy: string;
  role: string;
  summaryNote: string;
  signedAt: number | null;
}
