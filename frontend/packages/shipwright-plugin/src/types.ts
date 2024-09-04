import { IBuild as IBuildV1Alpha1 } from '@kubernetes-models/shipwright/shipwright.io/v1alpha1/Build';
import { IBuildRun as IBuildRunV1Alpha1 } from '@kubernetes-models/shipwright/shipwright.io/v1alpha1/BuildRun';
import { IBuildStrategy as IBuildStrategyV1Alpha1 } from '@kubernetes-models/shipwright/shipwright.io/v1alpha1/BuildStrategy';
import { IClusterBuildStrategy as IClusterBuildStrategyV1Alpha1 } from '@kubernetes-models/shipwright/shipwright.io/v1alpha1/ClusterBuildStrategy';
import { IBuild as IBuildV1Beta1 } from '@kubernetes-models/shipwright/shipwright.io/v1beta1/Build';
import { IBuildRun as IBuildRunV1Beta1 } from '@kubernetes-models/shipwright/shipwright.io/v1beta1/BuildRun';
import { IBuildStrategy as IBuildStrategyV1Beta1 } from '@kubernetes-models/shipwright/shipwright.io/v1beta1/BuildStrategy';
import { IClusterBuildStrategy as IClusterBuildStrategyV1Beta1 } from '@kubernetes-models/shipwright/shipwright.io/v1beta1/ClusterBuildStrategy';
import { K8sResourceCondition } from '@console/internal/module/k8s';

// Add missing latestBuild to Build
export type Build =
  | (IBuildV1Alpha1 & { latestBuild?: BuildRun })
  | (IBuildV1Beta1 & { latestBuild?: BuildRun });

export type BuildSpec = IBuildV1Alpha1['spec'] & IBuildV1Beta1['spec'];

export type BuildStatus = IBuildV1Alpha1['status'] & IBuildV1Beta1['status'];

export type ClusterBuildStrategyKind = IClusterBuildStrategyV1Alpha1 | IClusterBuildStrategyV1Beta1;

export type BuildStrategyKind = IBuildStrategyV1Alpha1 | IBuildStrategyV1Beta1;

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

/** WARNING: The enum values corresponds to the `metadata.name` of the ClusterBuildStrategy CRs */
export enum ClusterBuildStrategy {
  BUILDAH = 'buildah',
  S2I = 'source-to-image',
  UNKNOWN = 'unknown',
}

export const ReadableClusterBuildStrategies: Record<ClusterBuildStrategy, string> = {
  // t('shipwright-plugin~Buildah')
  [ClusterBuildStrategy.BUILDAH]: `shipwright-plugin~Buildah`,
  // t('shipwright-plugin~Source-to-Image')
  [ClusterBuildStrategy.S2I]: `shipwright-plugin~Source-to-Image`,
  [ClusterBuildStrategy.UNKNOWN]: `shipwright-plugin~Unknown`,
};
