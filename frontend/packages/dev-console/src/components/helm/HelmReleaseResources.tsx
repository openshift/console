import * as React from 'react';
import { MultiListPage } from '@console/internal/components/factory';
import { K8sResourceKind, kindForReference } from '@console/internal/module/k8s';
import { DeploymentModel, StatefulSetModel, PodModel, SecretModel } from '@console/internal/models';
import HelmResourcesListComponent from './HelmResourcesListComponent';
import { flattenResources, helmReleaseResourceKindFilter } from './helm-release-resources-utils';
import { ServiceModel } from '../../../../knative-plugin/src/models';

export interface HelmReleaseResourcesProps {
  obj: K8sResourceKind;
}

const HelmReleaseResources: React.FC<HelmReleaseResourcesProps> = ({ obj: resourceDetails }) => {
  const { namespace } = resourceDetails?.metadata;
  const helmReleaseName = resourceDetails.metadata.labels?.name;
  const resources = [
    {
      kind: DeploymentModel.kind,
      namespaced: true,
      isList: true,
      selector: { release: `${helmReleaseName}` },
    },
    {
      kind: ServiceModel.kind,
      namespaced: true,
      isList: true,
      selector: { release: `${helmReleaseName}` },
    },
    {
      kind: StatefulSetModel.kind,
      namespaced: true,
      isList: true,
      selector: { release: `${helmReleaseName}` },
    },
    {
      kind: PodModel.kind,
      namespaced: true,
      isList: true,
      selector: { release: `${helmReleaseName}` },
    },
    {
      kind: SecretModel.kind,
      namespaced: true,
      isList: true,
      selector: { name: `${helmReleaseName}` },
    },
  ];
  return (
    <MultiListPage
      filterLabel={'Resources by name'}
      resources={resources}
      rowFilters={[
        {
          type: 'helmrelease-resource-kind',
          selected: resources.map(({ kind }) => kindForReference(kind)),
          reducer: ({ kind }) => kindForReference(kind),
          items: resources.map(({ kind }) => ({
            id: kindForReference(kind),
            title: kindForReference(kind),
          })),
          filter: helmReleaseResourceKindFilter,
        },
      ]}
      flatten={flattenResources}
      label="Resources"
      namespace={namespace}
      ListComponent={HelmResourcesListComponent}
    />
  );
};

export default HelmReleaseResources;
