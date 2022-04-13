import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { SecretModel } from '@console/internal/models';
import { PIPELINE_NAMESPACE } from '../pipelines/const';
import { PAC_SECRET_NAME } from './const';

export const createPACSecret = (
  appId: string,
  privateKey: string,
  webHookSecret: string,
  appName: string,
  appUrl: string,
  namespace: string = PIPELINE_NAMESPACE,
) => {
  const { apiVersion, kind } = SecretModel;
  const secretPayload = {
    apiVersion,
    stringData: {
      'github-application-id': appId,
      'webhook.secret': webHookSecret,
      'github-private-key': privateKey,
    },
    kind,
    metadata: {
      name: PAC_SECRET_NAME,
      namespace,
      annotations: { appName, appUrl },
    },
    type: SecretType.opaque,
  };

  return k8sCreateResource({ model: SecretModel, data: secretPayload });
};
