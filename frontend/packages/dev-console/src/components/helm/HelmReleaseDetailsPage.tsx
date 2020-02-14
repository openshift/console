import * as React from 'react';
import * as _ from 'lodash';
import { safeLoadAll } from 'js-yaml';
import { match as RMatch } from 'react-router';
import {
  navFactory,
  LoadingBox,
  StatusBox,
  FirehoseResult,
  FirehoseResource,
} from '@console/internal/components/utils';
import { coFetchJSON } from '@console/internal/co-fetch';
import { SecretModel } from '@console/internal/models';
import { ErrorPage404 } from '@console/internal/components/error';
import { DetailsPage } from '@console/internal/components/factory';
import { K8sResourceKindReference, K8sResourceKind } from '@console/internal/module/k8s';
import HelmReleaseResources from './HelmReleaseResources';
import HelmReleaseOverview from './HelmReleaseOverview';
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

const HelmReleaseDetailsPage: React.FC<HelmReleaseDetailsPageProps> = ({ secret, match }) => {
  const namespace = match.params.ns;
  const helmReleaseName = match.params.name;
  const [helmManifestResources, setHelmManifestResources] = React.useState<FirehoseResource[]>([]);

  React.useEffect(() => {
    let ignore = false;

    const fetchHelmReleases = async () => {
      let res: HelmRelease[];
      try {
        res = await coFetchJSON(`/api/helm/releases?ns=${namespace}`);
      } catch {
        return;
      }
      if (ignore) return;

      const releaseData = res?.filter((rel) => rel.name === helmReleaseName);
      const helmManifest = safeLoadAll(releaseData[0].manifest);

      const resources: FirehoseResource[] = helmManifest.map((resource: K8sResourceKind) => ({
        kind: resource.kind,
        name: resource.metadata.name,
        namespace,
        prop: `${resource.metadata.name}-${resource.kind.toLowerCase()}`,
        isList: false,
        optional: true,
      }));

      setHelmManifestResources(resources);
    };

    fetchHelmReleases();

    return () => {
      ignore = true;
    };
  }, [helmReleaseName, namespace]);

  if (!secret || (!secret.loaded && _.isEmpty(secret.loadError))) {
    return <LoadingBox />;
  }

  if (secret.loadError) {
    return <StatusBox loaded={secret.loaded} loadError={secret.loadError} />;
  }

  const secretResource = secret.data;

  if (!_.isEmpty(secretResource)) {
    return (
      <DetailsPage
        match={match}
        kindObj={SecretModel}
        name={secretResource[0]?.metadata.name}
        namespace={namespace}
        breadcrumbsFor={() => [
          {
            name: `Helm Releases`,
            path: `/helm-releases/ns/${namespace}`,
          },
          { name: `Helm Release Details`, path: `${match.url}` },
        ]}
        title={secretResource[0]?.metadata.labels?.name}
        kind={SecretReference}
        pages={[
          navFactory.details(HelmReleaseOverview),
          {
            href: 'resources',
            name: 'Resources',
            component: () => <HelmReleaseResources helmManifestResources={helmManifestResources} />,
          },
        ]}
        customKind={HelmReleaseReference}
      />
    );
  }

  return <ErrorPage404 />;
};

export default HelmReleaseDetailsPage;
