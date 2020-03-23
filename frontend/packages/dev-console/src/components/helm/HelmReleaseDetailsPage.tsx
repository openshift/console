import * as React from 'react';
import * as _ from 'lodash';
import { match as RMatch } from 'react-router';
import {
  navFactory,
  LoadingBox,
  StatusBox,
  FirehoseResult,
} from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { ErrorPage404 } from '@console/internal/components/error';
import { DetailsPage } from '@console/internal/components/factory';
import { K8sResourceKindReference } from '@console/internal/module/k8s';
import HelmReleaseResources from './HelmReleaseResources';
import HelmReleaseOverview from './HelmReleaseOverview';
import { deleteHelmRelease } from '../../actions/modify-helm-release';

const SecretReference: K8sResourceKindReference = 'Secret';
const HelmReleaseReference = 'HelmRelease';
export interface HelmReleaseDetailsPageProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
  secret?: FirehoseResult;
}

const HelmReleaseDetailsPage: React.FC<HelmReleaseDetailsPageProps> = ({ secret, match }) => {
  const namespace = match.params.ns;

  if (!secret || (!secret.loaded && _.isEmpty(secret.loadError))) {
    return <LoadingBox />;
  }

  if (secret.loadError) {
    return <StatusBox loaded={secret.loaded} loadError={secret.loadError} />;
  }

  const secretResource = secret.data;

  if (_.isEmpty(secretResource)) return <ErrorPage404 />;

  const secretName = secretResource[0]?.metadata.name;
  const releaseName = secretResource[0]?.metadata.labels?.name;

  const menuActions = [
    () => deleteHelmRelease(releaseName, namespace, `/helm-releases/ns/${namespace}`),
  ];

  return (
    <DetailsPage
      kindObj={SecretModel}
      match={match}
      menuActions={menuActions}
      name={secretName}
      namespace={namespace}
      breadcrumbsFor={() => [
        {
          name: `Helm Releases`,
          path: `/helm-releases/ns/${namespace}`,
        },
        { name: `Helm Release Details`, path: `${match.url}` },
      ]}
      title={releaseName}
      kind={SecretReference}
      pages={[
        navFactory.details(HelmReleaseOverview),
        {
          href: 'resources',
          name: 'Resources',
          component: HelmReleaseResources,
        },
      ]}
      customKind={HelmReleaseReference}
    />
  );
};

export default HelmReleaseDetailsPage;
