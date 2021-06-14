import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { StatusBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import EditDeployment from './EditDeployment';

export type EditDeploymentPageProps = RouteComponentProps<{ ns?: string }>;

const EditDeploymentPage: React.FC<EditDeploymentPageProps> = ({ match, location }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const queryParams = new URLSearchParams(location.search);
  const kind = queryParams.get('kind');
  const name = queryParams.get('name');
  const heading = t('devconsole~Edit {{kind}}', { kind });
  const label = t('devconsole~Edit {{kind}} form', { kind });

  const [deployment, loaded, loadError] = useK8sWatchResource<K8sResourceKind>({
    kind,
    name,
    namespace,
  });

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{heading}</title>
      </Helmet>
      <StatusBox loaded={loaded} loadError={loadError} label={label} data={deployment}>
        <EditDeployment heading={heading} resource={deployment} name={name} namespace={namespace} />
      </StatusBox>
    </NamespacedPage>
  );
};

export default EditDeploymentPage;
