import { IBuild } from '@kubernetes-models/shipwright/shipwright.io/v1alpha1/Build';
import { IBuildRun } from '@kubernetes-models/shipwright/shipwright.io/v1alpha1/BuildRun';
import { K8sResourceCondition } from '@console/internal/module/k8s';

// Add missing latestBuild to Build
export type Build = IBuild & { latestBuild?: BuildRun };

export type BuildSpec = IBuild['spec'];

export type BuildStatus = IBuild['status'];

// Make status.conditions compatible with @console/internal/components/conditions props
export type BuildRun = IBuildRun & { status?: { conditions?: K8sResourceCondition[] } };

// The enum values need to match the dynamic-plugin `Status` `status` prop.
// A translation (title) is added in the BuildRunStatus component.
export enum ComputedBuildRunStatus {
  PENDING = 'Pending',
  RUNNING = 'Running',
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed',
  UNKNOWN = 'Unknown',
}
