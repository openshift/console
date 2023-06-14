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
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import { K8sResourceKindReference, SecretKind } from '@console/internal/module/k8s';
import { ActionMenu, ActionMenuVariant, Status, ActionServiceProvider } from '@console/shared';
import { HelmRelease, HelmActionOrigins } from '../../types/helm-types';
import { fetchHelmRelease, HelmReleaseStatusLabels, releaseStatus } from '../../utils/helm-utils';
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
  secrets?: FirehoseResult<SecretKind[]>;
}

interface LoadedHelmReleaseDetailsProps extends HelmReleaseDetailsProps {
  helmRelease: {
    loaded: boolean;
    loadError: Error;
    data: HelmRelease;
  };
}

export const LoadedHelmReleaseDetails: React.FC<LoadedHelmReleaseDetailsProps> = ({
  match,
  helmRelease,
  secrets,
}) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;

  if (helmRelease.loadError) {
    return <StatusBox loadError={helmRelease.loadError} />;
  }
  if (helmRelease.loaded && secrets.loadError) {
    return <StatusBox loadError={secrets.loadError} />;
  }
  if (!helmRelease.loaded || !secrets.loaded) {
    return <LoadingBox />;
  }
  if (!helmRelease.data || _.isEmpty(secrets.data)) {
    return <ErrorPage404 />;
  }

  const sortedSecrets = _.orderBy(secrets.data, (o) => Number(o.metadata.labels.version), 'desc');

  const releaseName = helmRelease.data?.name;
  const latestReleaseSecret = sortedSecrets[0];
  const latestSecretName = latestReleaseSecret?.metadata.name;
  const latestSecretStatus = latestReleaseSecret?.metadata?.labels?.status;

  const title = (
    <>
      {releaseName}
      <Badge isRead style={{ verticalAlign: 'middle', marginLeft: 'var(--pf-global--spacer--md)' }}>
        <Status
          status={releaseStatus(latestSecretStatus)}
          title={HelmReleaseStatusLabels[latestSecretStatus]}
        />
      </Badge>
    </>
  );

  const actionsScope = {
    release: {
      name: releaseName,
      namespace,
      version: helmRelease.data?.version,
      info: { status: latestSecretStatus },
    },
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
      kindObj={SecretModel}
      match={match}
      customActionMenu={customActionMenu}
      name={latestSecretName}
      namespace={namespace}
      customData={helmRelease.data}
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
          // t('helm-plugin~Resources')
          nameKey: 'helm-plugin~Resources',
          component: HelmReleaseResources,
        },
        {
          href: 'history',
          // t('helm-plugin~Revision history')
          nameKey: 'helm-plugin~Revision history',
          component: HelmReleaseHistory,
        },
        {
          href: 'releasenotes',
          // t('helm-plugin~Release notes')
          nameKey: 'helm-plugin~Release notes',
          component: HelmReleaseNotes,
        },
      ]}
      customKind={HelmReleaseReference}
    />
  );
};

const HelmReleaseDetails: React.FC<HelmReleaseDetailsProps> = ({ match }) => {
  const namespace = match.params.ns;
  const helmReleaseName = match.params.name;

  const [helmReleaseData, setHelmReleaseData] = React.useState<HelmRelease>();
  const [helmReleaseError, setHelmReleaseError] = React.useState<Error>();

  const [secrets, secretLoaded, secretLoadError] = useK8sWatchResource<SecretKind[]>(
    helmReleaseData
      ? {
          namespace,
          groupVersionKind: {
            version: 'v1',
            kind: SecretModel.kind,
          },
          selector: { matchLabels: { name: helmReleaseData.name } },
          isList: true,
        }
      : {
          isList: true,
        },
  );

  React.useEffect(() => {
    let mounted = true;

    const getHelmRelease = async () => {
      try {
        const helmRelease = await fetchHelmRelease(namespace, helmReleaseName);
        if (mounted) {
          setHelmReleaseData(helmRelease);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Error while loading helm release', err);
        setHelmReleaseError(err);
      }
    };

    // Implementation note: secretLoaded is initially true also when no helmReleaseData
    // is available and NO SECRETS are yet loaded. See helmReleaseData condition above.
    // It jumps to false when the data are loading... and back to true as soon as
    // the initial or updated data are fetched.
    // This if statement helps a little bit (there are still 2 calls) to reduce unneccessary API calls.
    if (secretLoaded) {
      getHelmRelease();
    }

    return () => {
      mounted = false;
    };
    // On upgrading/rolling back to another version a new helm release is created.
    // For fetching and showing the details of the new release adding secrets and
    // secretLoaded as dependency here since they are updated when a new release is created.
  }, [namespace, helmReleaseName, secrets, secretLoaded]);

  const helmRelease = {
    loaded: !!(helmReleaseData || helmReleaseError),
    loadError: helmReleaseError,
    data: helmReleaseData,
  };

  const secretsFirehoseResult: FirehoseResult<SecretKind[]> = {
    loaded: secretLoaded,
    loadError: secretLoadError,
    data: secrets,
  };

  return (
    <LoadedHelmReleaseDetails
      match={match}
      helmRelease={helmRelease}
      secrets={secretsFirehoseResult}
    />
  );
};

export default HelmReleaseDetails;
