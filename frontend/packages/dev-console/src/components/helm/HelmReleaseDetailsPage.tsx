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
import { Status } from '@console/shared';
import { Badge } from '@patternfly/react-core';
import { fetchHelmReleases } from './helm-utils';
import HelmReleaseResources from './HelmReleaseResources';
import HelmReleaseOverview from './HelmReleaseOverview';
import HelmReleaseHistory from './HelmReleaseHistory';
import { deleteHelmRelease, upgradeHelmRelease } from '../../actions/modify-helm-release';
import HelmReleaseNotes from './HelmReleaseNotes';
import { HelmRelease } from './helm-types';

const SecretReference: K8sResourceKindReference = 'Secret';
const HelmReleaseReference = 'HelmRelease';
export interface HelmReleaseDetailsPageProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
  secret?: FirehoseResult;
}

export interface LoadedHelmReleaseDetailsPageProps extends HelmReleaseDetailsPageProps {
  helmReleaseData: HelmRelease;
}

export const LoadedHelmReleaseDetailsPage: React.FC<LoadedHelmReleaseDetailsPageProps> = ({
  match,
  secret,
  helmReleaseData,
}) => {
  const namespace = match.params.ns;
  if (!helmReleaseData || !secret || (!secret.loaded && _.isEmpty(secret.loadError))) {
    return <LoadingBox />;
  }

  if (secret.loadError) {
    return <StatusBox loaded={secret.loaded} loadError={secret.loadError} />;
  }

  const secretResource = secret.data;

  if (_.isEmpty(secretResource)) return <ErrorPage404 />;

  const secretName = secretResource[0]?.metadata.name;
  const releaseName = helmReleaseData?.name;

  const title = (
    <>
      {releaseName}
      <Badge isRead style={{ verticalAlign: 'middle', marginLeft: 'var(--pf-global--spacer--md)' }}>
        <Status status={_.capitalize(helmReleaseData?.info?.status)} />
      </Badge>
    </>
  );

  const menuActions = [
    () => upgradeHelmRelease(releaseName, namespace),
    () => deleteHelmRelease(releaseName, namespace, `/helm-releases/ns/${namespace}`),
  ];

  return (
    <DetailsPage
      kindObj={SecretModel}
      match={match}
      menuActions={menuActions}
      name={secretName}
      namespace={namespace}
      customData={helmReleaseData}
      breadcrumbsFor={() => [
        {
          name: `Helm Releases`,
          path: `/helm-releases/ns/${namespace}`,
        },
        { name: `Helm Release Details`, path: `${match.url}` },
      ]}
      title={title}
      kind={SecretReference}
      pages={[
        navFactory.details(HelmReleaseOverview),
        {
          href: 'resources',
          name: 'Resources',
          component: HelmReleaseResources,
        },
        {
          href: 'history',
          name: 'History',
          component: HelmReleaseHistory,
        },
        {
          href: 'releasenotes',
          name: 'Release Notes',
          component: HelmReleaseNotes,
        },
      ]}
      customKind={HelmReleaseReference}
    />
  );
};

const HelmReleaseDetailsPage: React.FC<HelmReleaseDetailsPageProps> = ({ secret, match }) => {
  const namespace = match.params.ns;
  const helmReleaseName = match.params.name;

  const [helmReleaseData, setHelmReleaseData] = React.useState<any>();

  React.useEffect(() => {
    let ignore = false;

    const getHelmReleases = async () => {
      try {
        const helmReleases = await fetchHelmReleases(namespace);
        if (!ignore) {
          const releaseData = helmReleases.find((release) => release.name === helmReleaseName);
          setHelmReleaseData(releaseData);
        }
        // eslint-disable-next-line no-empty
      } catch {}
    };

    getHelmReleases();

    return () => {
      ignore = true;
    };
  }, [helmReleaseName, namespace]);

  return (
    <LoadedHelmReleaseDetailsPage match={match} secret={secret} helmReleaseData={helmReleaseData} />
  );
};

export default HelmReleaseDetailsPage;
