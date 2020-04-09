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
import { fetchHelmReleases } from '../helm-utils';
import HelmReleaseResources from './resources/HelmReleaseResources';
import HelmReleaseOverview from './overview/HelmReleaseOverview';
import HelmReleaseHistory from './history/HelmReleaseHistory';
import {
  deleteHelmRelease,
  upgradeHelmRelease,
  rollbackHelmRelease,
} from '../../../actions/modify-helm-release';
import HelmReleaseNotes from './HelmReleaseNotes';
import { HelmRelease } from '../helm-types';

const SecretReference: K8sResourceKindReference = 'Secret';
const HelmReleaseReference = 'HelmRelease';
interface HelmReleaseDetailsProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
  secret?: FirehoseResult;
}

interface LoadedHelmReleaseDetailsProps extends HelmReleaseDetailsProps {
  helmReleaseData: HelmRelease;
}

export const LoadedHelmReleaseDetails: React.FC<LoadedHelmReleaseDetailsProps> = ({
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

  const secretResources = secret.data;

  if (_.isEmpty(secretResources)) return <ErrorPage404 />;

  const sortedSecretResources = _.orderBy(
    secretResources,
    (o) => Number(o.metadata.labels.version),
    'desc',
  );

  const latestReleaseSecret = sortedSecretResources[0];
  const secretName = latestReleaseSecret?.metadata.name;
  const releaseName = helmReleaseData?.name;

  const title = (
    <>
      {releaseName}
      <Badge isRead style={{ verticalAlign: 'middle', marginLeft: 'var(--pf-global--spacer--md)' }}>
        <Status status={_.capitalize(latestReleaseSecret?.metadata.labels.status)} />
      </Badge>
    </>
  );

  const menuActions = [
    () => rollbackHelmRelease(releaseName, namespace),
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
          name: 'Revision History',
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

const HelmReleaseDetails: React.FC<HelmReleaseDetailsProps> = ({ secret, match }) => {
  const namespace = match.params.ns;
  const helmReleaseName = match.params.name;

  const [helmReleaseData, setHelmReleaseData] = React.useState<HelmRelease>();

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
    <LoadedHelmReleaseDetails match={match} secret={secret} helmReleaseData={helmReleaseData} />
  );
};

export default HelmReleaseDetails;
