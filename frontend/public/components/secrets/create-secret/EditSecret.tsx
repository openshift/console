import { FCC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { StatusBox } from '@console/shared/src/components/status/StatusBox';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretFormType } from './types';
import { toSecretFormType } from './utils';
import { SecretFormWrapper } from './SecretFormWrapper';

export const EditSecret: FCC<EditSecretProps> = ({ kind }) => {
  const { name, ns } = useParams();

  const [secret, secretLoaded, secretError] = useK8sWatchResource<K8sResourceKind>({
    kind,
    isList: false,
    namespace: ns,
    name,
  });

  const fixedData = secretLoaded
    ? ['kind', 'metadata'].reduce((acc, k) => ({ ...acc, [k]: secret[k] || '' }), {})
    : null;

  const formType = secretLoaded ? toSecretFormType(secret) : SecretFormType.generic;

  const { t } = useTranslation();

  return (
    <StatusBox loaded={secretLoaded} data={secret} loadError={secretError}>
      <SecretFormWrapper
        formType={formType}
        obj={secret}
        saveButtonText={t('public~Save')}
        fixed={fixedData}
      />
    </StatusBox>
  );
};

type EditSecretProps = {
  kind: string;
};
