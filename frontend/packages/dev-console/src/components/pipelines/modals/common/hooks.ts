import * as React from 'react';
import {
  useK8sWatchResource,
  WatchK8sResult,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel, ServiceAccountModel } from '@console/internal/models';
import { SecretKind } from '@console/internal/module/k8s';
import { ServiceAccountType } from '../../../../utils/pipeline-utils';
import { PIPELINE_SERVICE_ACCOUNT } from '../../const';

export const useFetchSecrets = (namespace: string): SecretKind[] => {
  const secretResource = React.useMemo(
    () => ({
      isList: true,
      namespace,
      kind: SecretModel.kind,
      prop: SecretModel.plural,
    }),
    [namespace],
  );
  const [secrets, secretsLoaded]: WatchK8sResult<SecretKind[]> = useK8sWatchResource<SecretKind[]>(
    secretResource,
  );

  return secretsLoaded ? secrets : null;
};

export const useFetchServiceAccount = (namespace: string): ServiceAccountType => {
  const serviceAccountResource: WatchK8sResource = React.useMemo(
    () => ({
      isList: false,
      namespace,
      kind: ServiceAccountModel.kind,
      prop: ServiceAccountModel.plural,
      name: PIPELINE_SERVICE_ACCOUNT,
    }),
    [namespace],
  );
  const [
    serviceAccount,
    serviceAccountLoaded,
  ]: WatchK8sResult<ServiceAccountType> = useK8sWatchResource<ServiceAccountType>(
    serviceAccountResource,
  );

  return serviceAccountLoaded ? serviceAccount : null;
};
