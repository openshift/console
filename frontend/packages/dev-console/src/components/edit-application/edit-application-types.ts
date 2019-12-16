import { K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResult } from '@console/internal/components/utils';

export interface AppResources {
  service?: FirehoseResult;
  route?: FirehoseResult;
  buildConfig?: FirehoseResult;
  imageStreams?: FirehoseResult;
}

export interface EditApplicationProps {
  namespace: string;
  appName: string;
  editAppResource: K8sResourceKind;
  resources?: AppResources;
  loaded?: boolean;
  onCancel?: () => void;
  onSubmit?: () => void;
}
