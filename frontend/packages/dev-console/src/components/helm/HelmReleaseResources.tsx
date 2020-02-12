import * as React from 'react';
import { MultiListPage } from '@console/internal/components/factory';
import { flattenResources } from './helm-release-resources-utils';
import HelmResourcesListComponent from './HelmResourcesListComponent';

export interface HelmReleaseResourcesProps {
  helmManifestResources;
}

const HelmReleaseResources: React.FC<HelmReleaseResourcesProps> = ({ helmManifestResources }) => (
  <MultiListPage
    filterLabel={'Resources by name'}
    resources={helmManifestResources}
    flatten={flattenResources}
    label="Resources"
    ListComponent={HelmResourcesListComponent}
  />
);

export default HelmReleaseResources;
