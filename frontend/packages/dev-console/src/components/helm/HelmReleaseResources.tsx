import * as React from 'react';
import { MultiListPage } from '@console/internal/components/factory';
import { FirehoseResource } from '@console/internal/components/utils';
import { flattenResources } from './helm-release-resources-utils';
import HelmResourcesListComponent from './HelmResourcesListComponent';

export interface HelmReleaseResourcesProps {
  helmManifestResources: FirehoseResource[];
}

const HelmReleaseResources: React.FC<HelmReleaseResourcesProps> = ({ helmManifestResources }) => (
  <MultiListPage
    filterLabel="Resources by name"
    resources={helmManifestResources}
    flatten={flattenResources}
    label="Resources"
    ListComponent={HelmResourcesListComponent}
  />
);

export default HelmReleaseResources;
