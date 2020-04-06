import * as React from 'react';
import { match as RMatch } from 'react-router';
import { safeLoadAll } from 'js-yaml';
import { MultiListPage } from '@console/internal/components/factory';
import { FirehoseResource } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { flattenReleaseResources } from '../../helm-utils';
import { HelmRelease } from '../../helm-types';
import HelmReleaseResourcesList from './HelmReleaseResourcesList';

export interface HelmReleaseResourcesProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
  customData: HelmRelease;
}

const HelmReleaseResources: React.FC<HelmReleaseResourcesProps> = ({ match, customData }) => {
  const namespace = match.params.ns;
  const helmManifest = customData ? safeLoadAll(customData.manifest) : [];
  const helmManifestResources: FirehoseResource[] = helmManifest.map(
    (resource: K8sResourceKind) => ({
      kind: resource.kind,
      name: resource.metadata.name,
      namespace,
      prop: `${resource.metadata.name}-${resource.kind.toLowerCase()}`,
      isList: false,
      optional: true,
    }),
  );
  return (
    <MultiListPage
      filterLabel="Resources by name"
      resources={helmManifestResources}
      flatten={flattenReleaseResources}
      label="Resources"
      ListComponent={HelmReleaseResourcesList}
    />
  );
};

export default HelmReleaseResources;
