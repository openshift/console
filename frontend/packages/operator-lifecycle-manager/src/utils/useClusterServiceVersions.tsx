import * as React from 'react';
import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import { CatalogExtensionHook, CatalogItem } from '@console/plugin-sdk';
import { ClusterServiceVersionModel } from '../models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ClusterServiceVersionKind } from '../types';
import { getImageForCSVIcon } from '@console/shared';
import { providedAPIsFor, referenceForProvidedAPI } from '../components';
import { isInternal } from '../dev-catalog';
import { ExpandCollapseDescription } from '@console/internal/components/catalog/description-utils';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';

const normalizeClusterServiceVersions = (
  clusterServiceVersions: ClusterServiceVersionKind[],
): CatalogItem[] => {
  const formatTileDescription = (csvDescription: string): string =>
    `## Operator Description\n${csvDescription}`;

  const operatorProvidedAPIs: CatalogItem[] = _.flatten(
    clusterServiceVersions.map((csv) => providedAPIsFor(csv).map((desc) => ({ ...desc, csv }))),
  )
    .reduce(
      (all, cur) =>
        all.find((v) => referenceForProvidedAPI(v) === referenceForProvidedAPI(cur))
          ? all
          : all.concat([cur]),
      [],
    )
    // remove internal CRDs
    .filter((crd) => !isInternal(crd))
    .map((desc) => {
      const { uid, creationTimestamp } = desc.csv.metadata;
      const { description } = desc;
      const provider = desc.csv.spec.provider.name;
      const operatorName = desc.csv.spec.displayName;
      const supportUrl =
        desc.csv.metadata.annotations?.['marketplace.openshift.io/support-workflow'];
      const markdownDescription = formatTileDescription(desc.csv.spec.description);
      const longDescription = `This resource is provided by ${operatorName}, a Kubernetes Operator enabled by the Operator Lifecycle Manager.`;
      const documentationUrl = _.get(
        (desc.csv.spec.links || []).find(({ linkName }) => linkName === 'Documentation'),
        'url',
      );
      const capabilityLevel = _.get(desc, ['csv', 'metadata', 'annotations', 'capabilities'], '')
        .toLowerCase()
        .replace(/\s/g, '');

      const detailsProperties = [
        {
          label: 'Capability Level',
          value: capabilityLevel,
        },
      ];

      const operatorDescription = (
        <ExpandCollapseDescription>
          <SyncMarkdownView content={markdownDescription} />
        </ExpandCollapseDescription>
      );

      const detailsDescriptions = [
        {
          value: <p>{longDescription}</p>,
        },
        {
          value: operatorDescription,
        },
      ];

      return {
        // NOTE: Faking a real k8s object to avoid fetching all CRDs
        uid,
        type: 'OperatorBackedService',
        name: desc.displayName || desc.kind,
        description,
        provider,
        tags: desc.csv.spec.keywords,
        creationTimestamp,
        supportUrl,
        documentationUrl,
        attributes: {
          operatorName,
        },
        icon: {
          class: null,
          url: getImageForCSVIcon(desc.csv.spec.icon[0]),
        },
        cta: {
          label: 'Create',
          href: `/k8s/ns/${desc.csv.metadata.namespace}/clusterserviceversions/${
            desc.csv.metadata.name
          }/${referenceForProvidedAPI(desc)}/~new`,
        },
        details: {
          properties: detailsProperties,
          descriptions: detailsDescriptions,
        },
      };
    });

  return operatorProvidedAPIs;
};

const useClusterServiceVersions: CatalogExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const resourceSelector = React.useMemo(
    () => ({
      isList: true,
      kind: referenceForModel(ClusterServiceVersionModel),
      namespaced: ClusterServiceVersionModel.namespaced,
      namespace,
      prop: referenceForModel(ClusterServiceVersionModel),
    }),
    [namespace],
  );

  const [clusterServiceVersions, loaded, loadedError] = useK8sWatchResource<
    ClusterServiceVersionKind[]
  >(resourceSelector);

  const normalizedCSVs = React.useMemo(
    () => normalizeClusterServiceVersions(clusterServiceVersions),
    [clusterServiceVersions],
  );

  return [normalizedCSVs, loaded, loadedError];
};

export default useClusterServiceVersions;
