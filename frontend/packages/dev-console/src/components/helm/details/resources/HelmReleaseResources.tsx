import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router';
import { MultiListPage } from '@console/internal/components/factory';
import { FirehoseResource } from '@console/internal/components/utils';
import {
  K8sResourceKind,
  referenceFor,
  modelFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { flattenReleaseResources, loadHelmManifestResources } from '../../helm-utils';
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
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const helmManifestResources = loadHelmManifestResources(customData);
  const firehoseResources: FirehoseResource[] = helmManifestResources.map(
    (resource: K8sResourceKind) => {
      const resourceKind = referenceFor(resource);
      const model = modelFor(resourceKind);
      return {
        ...(model.namespaced ? { namespace } : {}),
        kind: model.crd ? referenceForModel(model) : model.kind,
        name: resource.metadata.name,
        prop: `${resource.metadata.name}-${resource.kind.toLowerCase()}`,
        isList: false,
        optional: true,
      };
    },
  );
  return (
    <MultiListPage
      filterLabel={t('devconsole~Resources by name')}
      resources={firehoseResources}
      flatten={flattenReleaseResources}
      label={t('devconsole~Resources')}
      ListComponent={HelmReleaseResourcesList}
    />
  );
};

export default HelmReleaseResources;
