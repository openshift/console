import { CatalogExtensionHook, CatalogItem } from '@console/plugin-sdk';
import { CATALOG_TYPE } from '../rhoas-catalog-plugin';
import { managedKafkaIcon } from '../../const'
import * as React from 'react';
// import { useActiveNamespace } from '@console/shared';

const useRhoasCatalog: CatalogExtensionHook<CatalogItem[]> = (): [CatalogItem[], boolean, any] => {
  // const [namespace] = useActiveNamespace();
  const href = "/managedServices/managedkafka";//`/catalog/ns/${namespace}/rhoas/kafka`;
  const rhoasServices: CatalogItem[] = [
    {
      name: 'Managed Kafka',
      type: CATALOG_TYPE,
      uid: new Date().getTime().toString(),
      description: 'unlocked',
      provider: 'Red Hat',
      tags: ['Kafka', 'service', 'managed'],
      creationTimestamp: '2019-09-04T13:56:06Z',
      attributes: {
        version: '1',
      },
      icon: {
        class: "kafkaIcon",
        url: managedKafkaIcon,
      },
      cta: {
        label: 'Connect to server',
        href: href,
      },
      details: {
        properties: [{ label: 'Type', value: 'Red Hat Managed Service' }],
        descriptions: [{
          label: 'Red Hat OpenShift Streams for Apache Kafka',
          value: 'Red Hat OpenShift Streams for Apache Kafka lets you use streaming platform outside the box. Lorem Streamsum'
        }],
      },
    },
  ];

  const services = React.useMemo(() => rhoasServices, []);
  return [services, true, undefined];
};

export default useRhoasCatalog;
