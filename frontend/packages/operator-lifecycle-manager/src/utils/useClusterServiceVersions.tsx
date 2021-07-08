import * as React from 'react';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ExtensionHook, CatalogItem } from '@console/dynamic-plugin-sdk';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { ExpandCollapse } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { getImageForCSVIcon } from '@console/shared';
import { providedAPIsForCSV, referenceForProvidedAPI } from '../components';
import { ClusterServiceVersionModel } from '../models';
import { ClusterServiceVersionKind } from '../types';

type ExpandCollapseDescriptionProps = {
  children: React.ReactNode;
};

export const ExpandCollapseDescription: React.FC<ExpandCollapseDescriptionProps> = ({
  children,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState<boolean>(false);
  const toggle = (isExpanded) => {
    setExpanded(isExpanded);
  };
  return (
    <ExpandCollapse
      textExpanded={t('olm~Hide operator description')}
      textCollapsed={t('olm~Show operator description')}
      onToggle={toggle}
    >
      {/** used an empty Fragment here because Expandable always expects a children, using null throws react warning */}
      {expanded ? children : <></>}
    </ExpandCollapse>
  );
};

const normalizeClusterServiceVersions = (
  clusterServiceVersions: ClusterServiceVersionKind[],
  t: TFunction,
): CatalogItem[] => {
  const formatTileDescription = (csvDescription: string): string =>
    `## ${t('olm~Operator description')}\n${csvDescription}`;

  const operatorProvidedAPIs: CatalogItem[] = _.flatten(
    clusterServiceVersions.map((csv) => providedAPIsForCSV(csv).map((desc) => ({ ...desc, csv }))),
  )
    .reduce(
      (all, cur) =>
        all.find((v) => referenceForProvidedAPI(v) === referenceForProvidedAPI(cur))
          ? all
          : all.concat([cur]),
      [],
    )
    .map((desc) => {
      const { creationTimestamp } = desc.csv.metadata;
      const uid = `${desc.csv.metadata.uid}-${desc.displayName}`;
      const { description } = desc;
      const provider = desc.csv.spec.provider.name;
      const operatorName = desc.csv.spec.displayName;
      const supportUrl =
        desc.csv.metadata.annotations?.['marketplace.openshift.io/support-workflow'];
      const markdownDescription = formatTileDescription(desc.csv.spec.description);
      const longDescription = t(
        'olm~This resource is provided by {{operatorName}}, a Kubernetes Operator enabled by the Operator Lifecycle Manager.',
        { operatorName },
      );
      const documentationUrl = _.get(
        (desc.csv.spec.links || []).find(({ linkName }) => linkName === 'Documentation'),
        'url',
      );
      const capabilityLevel = _.get(desc, ['csv', 'metadata', 'annotations', 'capabilities'], '')
        .toLowerCase()
        .replace(/\s/g, '');

      const detailsProperties = [
        {
          label: t('olm~Capability level'),
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
          value: <p>{description}</p>,
        },
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
          url: getImageForCSVIcon(desc.csv.spec.icon?.[0]),
        },
        cta: {
          label: t('public~Create'),
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

const useClusterServiceVersions: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
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
    () => normalizeClusterServiceVersions(clusterServiceVersions, t),
    [clusterServiceVersions, t],
  );

  return [normalizedCSVs, loaded, loadedError];
};

export default useClusterServiceVersions;
