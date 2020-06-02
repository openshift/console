import { SecretKind } from '@console/internal/module/k8s';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { CommonPipelineModalFormikValues } from '../common/types';
import { SecretAnnotationId } from '../../const';
import { PipelineWorkspace } from '../../../../utils/pipeline-augment';

export type StartPipelineFormValues = CommonPipelineModalFormikValues & {
  workspaces: PipelineWorkspace[];
  newSecrets: SecretKind[];
  secretOpen: boolean;
  secretForm: {
    secretName: string;
    annotations: {
      key: SecretAnnotationId;
      value: string;
    };
    type: SecretType;
    formData: {};
  };
};
