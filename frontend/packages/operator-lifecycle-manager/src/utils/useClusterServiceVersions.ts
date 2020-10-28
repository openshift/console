import * as React from 'react';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { referenceForModel } from '@console/internal/module/k8s';
import { CatalogItem, CatalogItemDetailsPropertyVariant } from '@console/plugin-sdk';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { ClusterServiceVersionModel } from '../models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ClusterServiceVersionKind } from '../types';
import { getImageForCSVIcon } from '@console/shared';
import { providedAPIsFor, referenceForProvidedAPI } from '../components';
import { isInternal } from '../dev-catalog';

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
      const { creationTimestamp } = desc.csv.metadata;
      const { description } = desc;
      const provider = desc.csv.spec.provider.name;
      const supportUrl =
        desc.csv.metadata.annotations?.['marketplace.openshift.io/support-workflow'];
      const markdownDescription = formatTileDescription(desc.csv.spec.description);
      const longDescription = `This resource is provided by ${desc.csv.spec.displayName}, a Kubernetes Operator enabled by the Operator Lifecycle Manager.`;
      const documentationUrl = _.get(
        (desc.csv.spec.links || []).find(({ name }) => name === 'Documentation'),
        'url',
      );
      const capabilityLevel = _.get(desc, ['csv', 'metadata', 'annotations', 'capabilities'], '')
        .toLowerCase()
        .replace(/\s/g, '');

      const detailsProperties = [
        {
          type: CatalogItemDetailsPropertyVariant.TEXT,
          title: 'Capability Level',
          value: capabilityLevel,
        },
        {
          type: CatalogItemDetailsPropertyVariant.EXTERNAL_LINK,
          title: 'Support',
          label: 'Get Support',
          value: supportUrl,
        },
        {
          type: CatalogItemDetailsPropertyVariant.EXTERNAL_LINK,
          title: 'Documentation',
          value: documentationUrl,
        },
        {
          type: CatalogItemDetailsPropertyVariant.TEXT,
          title: 'Provider',
          value: provider,
        },
        {
          type: CatalogItemDetailsPropertyVariant.TIMESTAMP,
          title: 'Created At',
          value: creationTimestamp,
        },
      ];

      const detailsDescriptions = [
        {
          type: CatalogItemDetailsPropertyVariant.MARKDOWN,
          title: 'Description',
          value: description,
        },
        {
          type: CatalogItemDetailsPropertyVariant.MARKDOWN,
          title: 'Operator Description',
          value: markdownDescription,
        },
        {
          type: CatalogItemDetailsPropertyVariant.TEXT,
          value: longDescription,
        },
      ];
      return {
        // NOTE: Faking a real k8s object to avoid fetching all CRDs
        type: 'InstalledOperator',
        name: desc.displayName || desc.kind,
        description,
        provider,
        tags: desc.csv.spec.keywords,
        obj: {
          metadata: {
            uid: `${desc.csv.metadata.uid}-${desc.displayName}`,
            creationTimestamp,
          },
          ...desc,
        },
        icon: {
          class: null,
          url: getImageForCSVIcon(desc.csv.spec.icon),
        },
        cta: {
          label: 'Create',
          href: `/ns/${desc.csv.metadata.namespace}/clusterserviceversions/${
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

const useClusterServiceVersions = (): [CatalogItem[], boolean, any] => {
  const activeNamespace = useSelector(getActiveNamespace);

  const resourceSelector = React.useMemo(
    () => ({
      isList: true,
      kind: referenceForModel(ClusterServiceVersionModel),
      namespaced: ClusterServiceVersionModel.namespaced,
      namespace: activeNamespace,
      prop: referenceForModel(ClusterServiceVersionModel),
    }),
    [activeNamespace],
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
