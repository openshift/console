import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { StatusBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { DeploymentConfigModel } from '@console/internal/models';
import { DeploymentKind, K8sResourceKind } from '@console/internal/module/k8s';
import EditDeployment from './EditDeployment';
import { getDefaultDeploymentConfig } from './utils/deployment-utils';

export type DeploymentConfigPageProps = RouteComponentProps<{ ns: string; name: string }>;

const DeploymentConfigPage: React.FC<DeploymentConfigPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const { ns: namespace, name } = match.params;

  const isNew = !name || name === '~new';

  const [watchedDeployment, loaded, loadError] = useK8sWatchResource<DeploymentKind>(
    isNew
      ? null
      : {
          kind: DeploymentConfigModel.kind,
          name,
          namespace,
        },
  );

  const deploymentConfig: K8sResourceKind = isNew
    ? getDefaultDeploymentConfig(namespace)
    : watchedDeployment;

  const title = isNew
    ? t('devconsole~Create DeploymentConfig')
    : t('devconsole~Edit DeploymentConfig');

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <StatusBox loaded={loaded} loadError={loadError} label={title} data={deploymentConfig}>
        <EditDeployment
          heading={title}
          resource={deploymentConfig}
          name={isNew ? null : name}
          namespace={namespace}
        />
      </StatusBox>
    </>
  );
};

export default DeploymentConfigPage;
