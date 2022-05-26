import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { StatusBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { DeploymentKind, K8sResourceKind } from '@console/internal/module/k8s';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import EditDeployment from './EditDeployment';
import { getDefaultDeployment } from './utils/create-deployment-utils';

export type EditDeploymentPageProps = RouteComponentProps<{ ns?: string }>;

const EditDeploymentPage: React.FC<EditDeploymentPageProps> = ({ match, location }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const queryParams = new URLSearchParams(location.search);
  const name = queryParams.get('name');
  const isNew = !name || name === '~new';
  const kind = queryParams.get('kind');

  const [watchedDeployment, loaded, loadError] = useK8sWatchResource<DeploymentKind>(
    isNew
      ? null
      : {
          kind,
          name,
          namespace,
        },
  );

  const deployment: K8sResourceKind = isNew
    ? getDefaultDeployment(namespace, kind)
    : watchedDeployment;

  const heading = isNew
    ? t('devconsole~Create {{kind}}', { kind })
    : t('devconsole~Edit {{kind}}', { kind });
  const label = isNew
    ? t('devconsole~Create {{kind}}', { kind })
    : t('devconsole~Edit {{kind}} form', { kind });

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{heading}</title>
      </Helmet>
      <StatusBox loaded={loaded} loadError={loadError} label={label} data={deployment}>
        <EditDeployment
          heading={heading}
          resource={deployment}
          name={isNew ? null : name}
          namespace={namespace}
        />
      </StatusBox>
    </NamespacedPage>
  );
};

export default EditDeploymentPage;
