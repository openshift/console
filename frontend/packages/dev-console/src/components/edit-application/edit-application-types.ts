import type { FirehoseResult } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import type { PipelineKind } from '../../types/pipeline';

export interface AppResources {
  service?: FirehoseResult<K8sResourceKind>;
  route?: FirehoseResult<K8sResourceKind>;
  buildConfig?: FirehoseResult<K8sResourceKind>;
  shipwrightBuild?: FirehoseResult<K8sResourceKind>;
  pipeline?: FirehoseResult<PipelineKind>;
  imageStream?: FirehoseResult<K8sResourceKind[]>;
  editAppResource?: FirehoseResult<K8sResourceKind>;
  imageStreams?: FirehoseResult;
}

export interface EditApplicationProps {
  namespace: string;
  appName: string;
  resources?: AppResources;
  loaded?: boolean;
}
