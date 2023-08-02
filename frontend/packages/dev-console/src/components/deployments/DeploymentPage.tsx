import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { StatusBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { DeploymentModel } from '@console/internal/models';
import { DeploymentKind, K8sResourceKind } from '@console/internal/module/k8s';
import EditDeployment from './EditDeployment';
import { getDefaultDeployment } from './utils/deployment-utils';

const DeploymentPage: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace, name } = useParams();

  const isNew = !name || name === '~new';

  const [watchedDeployment, loaded, loadError] = useK8sWatchResource<DeploymentKind>(
    isNew
      ? null
      : {
          kind: DeploymentModel.kind,
          name,
          namespace,
        },
  );

  const deployment: K8sResourceKind = isNew ? getDefaultDeployment(namespace) : watchedDeployment;

  const title = isNew ? t('devconsole~Create Deployment') : t('devconsole~Edit Deployment');

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <StatusBox loaded={loaded} loadError={loadError} label={title} data={deployment}>
        <EditDeployment
          heading={title}
          resource={deployment}
          name={isNew ? null : name}
          namespace={namespace}
        />
      </StatusBox>
    </>
  );
};

export default DeploymentPage;
