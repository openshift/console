import * as React from 'react';
import { safeLoadAll } from 'js-yaml';
import { MultiListPage } from '@console/internal/components/factory';
import { FirehoseResource } from '@console/internal/components/utils';
import { coFetchJSON } from '@console/internal/co-fetch';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { flattenResources } from './helm-release-resources-utils';
import HelmResourcesListComponent from './HelmResourcesListComponent';
import { HelmRelease } from './helm-types';
import { match as RMatch } from 'react-router';

export interface HelmReleaseResourcesProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
}

const HelmReleaseResources: React.FC<HelmReleaseResourcesProps> = ({ match }) => {
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

  return (
    <MultiListPage
      filterLabel="Resources by name"
      resources={helmManifestResources}
      flatten={flattenResources}
      label="Resources"
      ListComponent={HelmResourcesListComponent}
    />
  );
};

export default HelmReleaseResources;
