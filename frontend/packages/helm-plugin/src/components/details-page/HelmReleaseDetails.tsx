import * as React from 'react';
import { Badge } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router';
import { ErrorPage404 } from '@console/internal/components/error';
import { DetailsPage } from '@console/internal/components/factory';
import {
  navFactory,
  LoadingBox,
  StatusBox,
  FirehoseResult,
} from '@console/internal/components/utils';
import { K8sResourceKindReference } from '@console/internal/module/k8s';
import { ActionMenu, ActionMenuVariant, Status, ActionServiceProvider } from '@console/shared';
import { HelmRelease, HelmActionOrigins } from '../../types/helm-types';
import { fetchHelmReleases } from '../../utils/helm-utils';
import HelmReleaseHistory from './history/HelmReleaseHistory';
import HelmReleaseNotes from './notes/HelmReleaseNotes';
import HelmReleaseOverview from './overview/HelmReleaseOverview';
import HelmReleaseResources from './resources/HelmReleaseResources';

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
  const { t } = useTranslation();
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

  const actionsScope = {
    release: { name: releaseName, namespace, version: helmReleaseData.version },
    actionOrigin: HelmActionOrigins.details,
  };

  const customActionMenu = (
    <ActionServiceProvider context={{ 'helm-actions': actionsScope }}>
      {({ actions, options, loaded }) =>
        loaded && (
          <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
        )
      }
    </ActionServiceProvider>
  );

  return (
    <DetailsPage
      match={match}
      customActionMenu={customActionMenu}
      name={secretName}
      namespace={namespace}
      customData={helmReleaseData}
      breadcrumbsFor={() => [
        {
          name: t('helm-plugin~Helm Releases'),
          path: `/helm-releases/ns/${namespace}`,
        },
        { name: t('helm-plugin~Helm Release details'), path: `${match.url}` },
      ]}
      title={title}
      kind={SecretReference}
      pages={[
        navFactory.details(HelmReleaseOverview),
        {
          href: 'resources',
          name: t('helm-plugin~Resources'),
          component: HelmReleaseResources,
        },
        {
          href: 'history',
          name: t('helm-plugin~Revision history'),
          component: HelmReleaseHistory,
        },
        {
          href: 'releasenotes',
          name: t('helm-plugin~Release notes'),
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
    // On upgrading/rolling back to another version a new helm release is created.
    // For fetching and showing the details of the new release adding secret.data as depedency here
    // since secret's data list gets updated when a new release is created.
  }, [helmReleaseName, namespace, secret.data]);

  return (
    <LoadedHelmReleaseDetails match={match} secret={secret} helmReleaseData={helmReleaseData} />
  );
};

export default HelmReleaseDetails;
