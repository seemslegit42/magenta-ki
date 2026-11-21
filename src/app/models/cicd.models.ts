export type PipelineStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
export type PipelineStepName = 
  | 'checkout' 
  | 'install' 
  | 'lint' 
  | 'test_unit' 
  | 'test_e2e' 
  | 'build_angular' 
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
  triggerEvent: 'push' | 'pull_request' | 'workflow_dispatch' | 'scheduled';
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
  environment: 'staging' | 'preview';
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
