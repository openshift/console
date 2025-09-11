import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { MultiListPage } from '@console/internal/components/factory';
import { FirehoseResource } from '@console/internal/components/utils';
import {
  K8sResourceKind,
  referenceFor,
  modelFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { HelmRelease, K8sResourceWithMetadata } from '../../../types/helm-types';
import { flattenReleaseResources, loadHelmManifestResources } from '../../../utils/helm-utils';
import HelmReleaseResourcesList from './HelmReleaseResourcesList';

// Type guard to check if a resource has required metadata fields
const hasRequiredMetadata = (resource: K8sResourceKind): resource is K8sResourceWithMetadata => {
  return !!(resource.metadata?.name && resource.kind);
};

export interface HelmReleaseResourcesProps {
  customData: HelmRelease;
}

const HelmReleaseResources: React.FC<HelmReleaseResourcesProps> = ({ customData }) => {
  const { t } = useTranslation();
  const params = useParams();
  const namespace = params.ns;
  const helmManifestResources = loadHelmManifestResources(customData);
  const firehoseResources: FirehoseResource[] = helmManifestResources
    .filter(hasRequiredMetadata)
    .map((resource: K8sResourceWithMetadata) => {
      const resourceKind = referenceFor(resource);
      const model = modelFor(resourceKind);
      const resourceName = resource.metadata.name;
      const resourceKindLower = resource.kind.toLowerCase();

      return {
        ...(model.namespaced && namespace ? { namespace } : {}),
        kind: model.crd ? referenceForModel(model) : model.kind,
        name: resourceName,
        prop: `${resourceName}-${resourceKindLower}`,
        isList: false,
        optional: true,
      };
    });
  return (
    <MultiListPage
      filterLabel={t('helm-plugin~Resources by name')}
      resources={firehoseResources}
      flatten={flattenReleaseResources}
      label={t('helm-plugin~Resources')}
      ListComponent={HelmReleaseResourcesList}
    />
  );
};

export default HelmReleaseResources;
