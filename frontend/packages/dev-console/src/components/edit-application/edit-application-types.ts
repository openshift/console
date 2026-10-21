import type { K8sResourceCommon, WatchK8sResultsObject } from '@console/dynamic-plugin-sdk';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import type { PipelineKind } from '../../types/pipeline';

export interface AppResources {
  service?: WatchK8sResultsObject<K8sResourceKind>;
  route?: WatchK8sResultsObject<K8sResourceKind>;
  buildConfig?: WatchK8sResultsObject<K8sResourceKind>;
  shipwrightBuild?: WatchK8sResultsObject<K8sResourceKind>;
  pipeline?: WatchK8sResultsObject<PipelineKind>;
  imageStream?: WatchK8sResultsObject<K8sResourceKind[]>;
  editAppResource?: WatchK8sResultsObject<K8sResourceKind>;
  imageStreams?: WatchK8sResultsObject<K8sResourceCommon[]>;
}

export interface EditApplicationProps {
  namespace: string;
  appName: string;
  resources?: AppResources;
  loaded?: boolean;
}
