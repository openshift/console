import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { ConfigMapModel } from '@console/internal/models';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';
import { StatusBox } from '../utils/status-box';
import ConfigMapForm from './ConfigMapForm';
import { ConfigMap } from './types';

const ConfigMapPage: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace, name } = useParams();
  const isCreateFlow: boolean = !name || name === '~new';

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
      <Helmet>
        <title>{title}</title>
      </Helmet>
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

export default ConfigMapPage;
