import * as React from 'react';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ClusterServiceClassModel } from '@console/internal/models';
import {
  K8sResourceKind,
  referenceForModel,
  serviceClassDisplayName,
} from '@console/internal/module/k8s';
import { CatalogItem, CatalogItemDetailsPropertyVariant } from '@console/plugin-sdk';
import { getActiveNamespace } from '@console/internal/actions/ui';
import {
  getServiceClassIcon,
  getServiceClassImage,
} from '@console/internal/components/catalog/catalog-item-icon';

const normalizeServiceClasses = (
  serviceClasses: K8sResourceKind[],
  activeNamespace: string = '',
): CatalogItem[] => {
  return _.reduce(
    serviceClasses,
    (acc, serviceClass) => {
      // Prefer native templates to template-service-broker service classes.
      if (
        serviceClass.status.removedFromBrokerCatalog ||
        serviceClass.spec.clusterServiceBrokerName === 'template-service-broker'
      ) {
        return acc;
      }

      const tileName = serviceClassDisplayName(serviceClass);
      const tileDescription = serviceClass.spec.description;
      const tileProvider = serviceClass.spec.externalMetadata?.providerDisplayName;

      const iconClass = getServiceClassIcon(serviceClass);
      const tileImgUrl = getServiceClassImage(serviceClass);

      const supportUrl = _.get(serviceClass, 'spec.externalMetadata.supportUrl');
      const longDescription = _.get(serviceClass, 'spec.externalMetadata.longDescription');
      const documentationUrl = _.get(serviceClass, 'spec.externalMetadata.documentationUrl');

      const detailsProperties = [
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
          value: tileProvider,
        },
        {
          type: CatalogItemDetailsPropertyVariant.TIMESTAMP,
          title: 'Created At',
          value: serviceClass.metadata.creationTimestamp,
        },
      ];

      const detailsDescriptions = [
        {
          type: CatalogItemDetailsPropertyVariant.MARKDOWN,
          title: 'Description',
          value: tileDescription,
        },
        {
          type: CatalogItemDetailsPropertyVariant.MARKDOWN,
          title: 'Service Class Description',
          value: longDescription,
        },
      ];

      acc.push({
        type: 'ClusterServiceClass',
        name: tileName,
        description: tileDescription,
        provider: tileProvider,
        tags: serviceClass.spec.tags,
        obj: serviceClass,
        icon: {
          class: tileImgUrl ? null : iconClass,
          url: tileImgUrl,
        },
        cta: {
          label: 'Create Service Instance',
          href: `/catalog/create-service-instance?cluster-service-class=${serviceClass.metadata.name}&preselected-ns=${activeNamespace}`,
        },
        details: {
          properties: detailsProperties,
          descriptions: detailsDescriptions,
        },
      });
      return acc;
    },
    [],
  );
};

const useServiceClasses = (): [CatalogItem[], boolean, any] => {
  const resourceSelector = {
    isList: true,
    kind: referenceForModel(ClusterServiceClassModel),
    namespaced: false,
    prop: 'clusterServiceClasses',
  };
  const [serviceClasses, loaded, loadedError] = useK8sWatchResource<K8sResourceKind[]>(
    resourceSelector,
  );

  const activeNamespace = useSelector(getActiveNamespace);

  const normalizedServiceClasses = React.useMemo(
    () => normalizeServiceClasses(serviceClasses, activeNamespace),
    [activeNamespace, serviceClasses],
  );

  return [normalizedServiceClasses, loaded, loadedError];
};

export default useServiceClasses;
