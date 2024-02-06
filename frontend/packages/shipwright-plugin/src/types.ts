import { IBuild as IBuildV1Alpha1 } from '@kubernetes-models/shipwright/shipwright.io/v1alpha1/Build';
import { IBuildRun as IBuildRunV1Alpha1 } from '@kubernetes-models/shipwright/shipwright.io/v1alpha1/BuildRun';
import { IBuild as IBuildV1Beta1 } from '@kubernetes-models/shipwright/shipwright.io/v1beta1/Build';
import { IBuildRun as IBuildRunV1Beta1 } from '@kubernetes-models/shipwright/shipwright.io/v1beta1/BuildRun';
import { K8sResourceCondition } from '@console/internal/module/k8s';

// Add missing latestBuild to Build
export type Build =
  | (IBuildV1Alpha1 & { latestBuild?: BuildRun })
  | (IBuildV1Beta1 & { latestBuild?: BuildRun });

export type BuildSpec = IBuildV1Alpha1['spec'] & IBuildV1Beta1['spec'];

export type BuildStatus = IBuildV1Alpha1['status'] & IBuildV1Beta1['status'];

// Make status.conditions compatible with @console/internal/components/conditions props
export type BuildRun =
  | (IBuildRunV1Alpha1 & {
      status?: { conditions?: K8sResourceCondition[]; latestTaskRunRef?: string };
    })
  | (IBuildRunV1Beta1 & {
      status?: { conditions?: K8sResourceCondition[]; taskRunName?: string };
    });

// The enum values need to match the dynamic-plugin `Status` `status` prop.
// A translation (title) is added in the BuildRunStatus component.
export enum ComputedBuildRunStatus {
  PENDING = 'Pending',
  RUNNING = 'Running',
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed',
  UNKNOWN = 'Unknown',
}
