import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { MultiListPage } from '@console/internal/components/factory';
import type { FirehoseResource } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor, modelFor, referenceForModel } from '@console/internal/module/k8s';
import type { HelmRelease } from '../../../types/helm-types';
import { flattenReleaseResources, loadHelmManifestResources } from '../../../utils/helm-utils';
import HelmReleaseResourcesList from './HelmReleaseResourcesList';

export interface HelmReleaseResourcesProps {
  customData: HelmRelease;
}

const HelmReleaseResources: FC<HelmReleaseResourcesProps> = ({ customData }) => {
  const { t } = useTranslation();
  const params = useParams();
  const namespace = params.ns;
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
      resources={firehoseResources}
      flatten={flattenReleaseResources}
      label={t('helm-plugin~Resources')}
      ListComponent={HelmReleaseResourcesList}
      omitFilterToolbar
    />
  );
};

export default HelmReleaseResources;
