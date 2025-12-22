import type { FC } from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { ConfigMapModel } from '@console/internal/models';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';
import { StatusBox } from '../utils/status-box';
import ConfigMapForm from './ConfigMapForm';
import { ConfigMap } from './types';

export const ConfigMapPage: FC = () => {
  const { t } = useTranslation();
  const { ns: namespace, name } = useParams();
  const isCreateFlow: boolean = !name;

  const [watchedConfigMap, loaded, loadError] = useK8sWatchResource<ConfigMap>(
    isCreateFlow
      ? null
      : {
          kind: ConfigMapModel.kind,
          name,
          namespace,
        },
  );
  const title = isCreateFlow ? t('public~Create ConfigMap') : t('public~Edit ConfigMap');
  const configMap: ConfigMap = isCreateFlow ? null : watchedConfigMap;

  const configMapForm = (
    <ConfigMapForm
      name={name}
      namespace={namespace}
      configMap={configMap}
      title={title}
      isCreateFlow={isCreateFlow}
    />
  );

  return (
    <>
      <DocumentTitle>{title}</DocumentTitle>
      {isCreateFlow ? (
        configMapForm
      ) : (
        <StatusBox loaded={loaded} loadError={loadError} label={title} data={configMap}>
          {configMapForm}
        </StatusBox>
      )}
    </>
  );
};
