import { CatalogExtensionHook, CatalogItem } from '@console/plugin-sdk';
import { CATALOG_TYPE } from '../rhoas-catalog-plugin';
import { managedKafkaIcon } from '../../const';
import * as React from 'react';
// import { useActiveNamespace } from '@console/shared';

const useRhoasCatalog: CatalogExtensionHook<CatalogItem[]> = (): [CatalogItem[], boolean, any] => {
  // const [namespace] = useActiveNamespace();
  const href = '/managedServices/managedkafka'; // `/catalog/ns/${namespace}/rhoas/kafka`;
  const rhoasServices: CatalogItem[] = [
    {
      name: 'Managed Services',
      type: CATALOG_TYPE,
      uid: new Date().getTime().toString(),
      description: '',
      provider: 'Red Hat',
      tags: ['Kafka', 'service', 'managed'],
      creationTimestamp: '2019-09-04T13:56:06Z',
      attributes: {
        version: '1',
      },
      icon: {
        class: 'kafkaIcon',
        url: managedKafkaIcon,
      },
      cta: {
        label: 'Connect to server',
        href,
      },
      details: {
        properties: [{ label: 'Type', value: 'Red Hat Managed Service' }],
        descriptions: [
          {
            label: '',
            value: '',
          },
        ],
      },
    },
  ];

  const services = React.useMemo(() => rhoasServices, [rhoasServices]);
  return [services, true, undefined];
};

export default useRhoasCatalog;
