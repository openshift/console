import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { StatusBox } from '@console/shared/src/components/status/StatusBox';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import { SecretTypeAbstraction } from './types';
import { toTypeAbstraction } from './utils';
import { SecretFormWrapper } from './SecretFormWrapper';

export const EditSecret: React.FC = () => {
  const params = useParams();

  const [secret, secretLoaded, secretError] = useK8sWatchResource<K8sResourceKind>({
    kind: SecretModel.kind,
    isList: false,
    namespace: params.ns,
    name: params.name,
  });

  const fixedData = secretLoaded
    ? ['kind', 'metadata'].reduce((acc, k) => ({ ...acc, [k]: secret[k] || '' }), {})
    : null;

  const secretTypeAbstraction = secretLoaded
    ? toTypeAbstraction(secret)
    : SecretTypeAbstraction.generic;

  const { t } = useTranslation();

  return (
    <StatusBox loaded={secretLoaded} data={secret} loadError={secretError}>
      <SecretFormWrapper
        secretTypeAbstraction={secretTypeAbstraction}
        obj={secret}
        saveButtonText={t('public~Save')}
        fixed={fixedData}
      />
    </StatusBox>
  );
};
